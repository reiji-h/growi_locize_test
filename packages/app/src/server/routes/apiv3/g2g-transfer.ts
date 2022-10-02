import express, { NextFunction, Request, Router } from 'express';
import { body } from 'express-validator';

import TransferKeyModel from '~/server/models/transfer-key';
import { isG2GTransferError } from '~/server/models/vo/g2g-transfer-error';
import { IDataGROWIInfo, X_GROWI_TRANSFER_KEY_HEADER_NAME } from '~/server/service/g2g-transfer';
import loggerFactory from '~/utils/logger';
import { TransferKey } from '~/utils/vo/transfer-key';

import Crowi from '../../crowi';
import { apiV3FormValidator } from '../../middlewares/apiv3-form-validator';
import ErrorV3 from '../../models/vo/error-apiv3';

import { ApiV3Response } from './interfaces/apiv3-response';

const logger = loggerFactory('growi:routes:apiv3:transfer');

const validator = {
  transfer: [
    body('transferKey').isString().withMessage('transferKey is required'),
  ],
};

/*
 * Routes
 */
module.exports = (crowi: Crowi): Router => {
  const { g2gTransferPusherService, g2gTransferReceiverService, exportService } = crowi;
  if (g2gTransferPusherService == null || g2gTransferReceiverService == null || exportService == null) {
    throw Error('GROWI is not ready for g2g transfer');
  }

  const isInstalled = crowi.configManager?.getConfig('crowi', 'app:installed');

  const accessTokenParser = require('../../middlewares/access-token-parser')(crowi);
  const adminRequired = require('../../middlewares/admin-required')(crowi);
  const loginRequiredStrictly = require('../../middlewares/login-required')(crowi);

  // Middleware
  const adminRequiredIfInstalled = (req: Request, res: ApiV3Response, next: NextFunction) => {
    if (!isInstalled) {
      next();
      return;
    }

    return adminRequired(req, res, next);
  };

  // Middleware
  const appSiteUrlRequiredIfNotInstalled = (req: Request, res: ApiV3Response, next: NextFunction) => {
    if (!isInstalled && req.body.appSiteUrl != null) {
      next();
      return;
    }

    if (crowi.configManager?.getConfig('crowi', 'app:siteUrl') != null || req.body.appSiteUrl != null) {
      next();
      return;
    }

    return res.apiv3Err(new ErrorV3('Body param "appSiteUrl" is required when GROWI is NOT installed yet'), 400);
  };

  // Local middleware to check if key is valid or not
  const verifyAndExtractTransferKey = async(req: Request & { transferKey: TransferKey }, res: ApiV3Response, next: NextFunction) => {
    const transferKeyString = req.headers[X_GROWI_TRANSFER_KEY_HEADER_NAME];

    if (typeof transferKeyString !== 'string') {
      return res.apiv3Err(new ErrorV3('Invalid transfer key or not set.', 'invalid_transfer_key'), 400);
    }

    let transferKey;
    try {
      transferKey = await (TransferKeyModel as any).findOneActiveTransferKey(transferKeyString); // TODO: Improve TS of models
    }
    catch (err) {
      logger.error(err);
      return res.apiv3Err(new ErrorV3('Error occurred while trying to fing a transfer key.', 'failed_to_find_transfer_key'), 500);
    }

    if (transferKey == null) {
      return res.apiv3Err(new ErrorV3('Transfer key has expired or not found.', 'transfer_key_expired_or_not_found'), 404);
    }

    // Inject transferKey to req
    try {
      req.transferKey = TransferKey.parse(transferKey.value);
    }
    catch (err) {
      logger.error(err);
      return res.apiv3Err(new ErrorV3('Transfer key is invalid.', 'invalid_transfer_key'), 500);
    }

    next();
  };

  const router = express.Router();

  // Auto import
  router.post('/', verifyAndExtractTransferKey, async(req: Request & { transferKey: TransferKey }, res: ApiV3Response) => {
    const { transferKey } = req;


    return;
  });

  router.get('/growi-info', /* verifyAndExtractTransferKey, */ async(req: Request & { transferKey: TransferKey }, res: ApiV3Response) => {
    let growiInfo: IDataGROWIInfo;
    try {
      growiInfo = await g2gTransferReceiverService.answerGROWIInfo();
    }
    catch (err) {
      logger.error(err);

      if (!isG2GTransferError(err)) {
        return res.apiv3Err(new ErrorV3('Failed to prepare growi info', 'failed_to_prepare_growi_info'), 500);
      }

      return res.apiv3Err(new ErrorV3(err.message, err.code), 500);
    }

    return res.apiv3({ growiInfo });
  });

  router.post('/generate-key', accessTokenParser, adminRequiredIfInstalled, appSiteUrlRequiredIfNotInstalled, async(req: Request, res: ApiV3Response) => {
    const strAppSiteUrl = req.body.appSiteUrl ?? crowi.configManager?.getConfig('crowi', 'app:siteUrl');

    // Generate transfer key string
    let appSiteUrl: URL;
    try {
      appSiteUrl = new URL(strAppSiteUrl);
    }
    catch (err) {
      logger.error(err);
      return res.apiv3Err(new ErrorV3('appSiteUrl may be wrong', 'failed_to_generate_key_string'));
    }

    // Save TransferKey document
    let transferKeyString: string;
    try {
      transferKeyString = await g2gTransferService.createTransferKey(appSiteUrl);
    }
    catch (err) {
      logger.error(err);
      return res.apiv3Err(new ErrorV3('Error occurred while generating transfer key.', 'failed_to_generate_key'));
    }

    return res.apiv3({ transferKey: transferKeyString });
  });

  // Auto export
  // TODO: Use socket to send progress info to the client
  // eslint-disable-next-line max-len
  router.post('/transfer', accessTokenParser, loginRequiredStrictly, adminRequired, validator.transfer, apiV3FormValidator, async(req: Request, res: ApiV3Response) => {
    // 1. Ask
    // 2. Start

    const { transferKey: transferKeyString } = req.body;

    let tk: TransferKey;
    try {
      tk = TransferKey.parse(transferKeyString);
    }
    catch (err) {
      logger.error(err);
      return res.apiv3Err(new ErrorV3('Transfer key is invalid', 'transfer_key_invalid'), 400);
    }

    const canTransfer = await g2gTransferPusherService.canTransfer();

    const { appUrl, key } = tk;

    // Generate export zip
    let zipFileStream;
    try {
      zipFileStream = await g2gTransferPusherService.startTransfer(tk);
    }
    catch (err) {
      logger.error(err);
      return res.apiv3Err(new ErrorV3('Error occurred while'));
    }

    // Send a zip file to other growi via axios
    // (async() => {
    //   try {
    //     // TODO: Make zipFileStream work
    //     await axios.post('/_api/v3/g2g-transfer/', zipFileStream, {
    //       baseURL: appUrl.origin,
    //       headers: {
    //         [X_GROWI_TRANSFER_KEY_HEADER_NAME]: key,
    //       },
    //     });
    //   }
    //   catch (errs) {
    //     if (!Array.isArray(errs)) {
    //       // TODO: socker.emit(failed_to_transfer);
    //       return;
    //     }

    //     const err = errs[0];

    //     if (!isG2GTransferError(err)) {
    //       // TODO: socker.emit(failed_to_transfer);
    //       return;
    //     }

    //     const g2gTransferError = err;

    //     logger.error(g2gTransferError);
    //     // TODO: socker.emit(failed_to_transfer);
    //     return;
    //   }
    // })();

    return res.apiv3({ message: 'Successfully requested auto transfer.' });
  });

  return router;
};
