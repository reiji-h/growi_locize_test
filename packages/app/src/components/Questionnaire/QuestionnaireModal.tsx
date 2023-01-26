import { useCallback } from 'react';

import { useTranslation } from 'next-i18next';
import {
  Modal, ModalHeader, ModalBody, ModalFooter,
} from 'reactstrap';

import { apiv3Put } from '~/client/util/apiv3-client';
import { toastSuccess, toastError } from '~/client/util/toastr';
import { IAnswer } from '~/interfaces/questionnaire/answer';
import { IGrowiInfo } from '~/interfaces/questionnaire/growi-info';
import { IQuestionnaireAnswer } from '~/interfaces/questionnaire/questionnaire-answer';
import { IQuestionnaireOrderHasId } from '~/interfaces/questionnaire/questionnaire-order';
import { IUserInfo } from '~/interfaces/questionnaire/user-info';
import { useCurrentUser, useGrowiVersion } from '~/stores/context';
import { useQuestionnaireModal } from '~/stores/modal';
import axios from '~/utils/axios';
import loggerFactory from '~/utils/logger';

import Question from './Question';

const logger = loggerFactory('growi:QuestionnaireModal');

type QuestionnaireModalProps = {
  questionnaireOrder: IQuestionnaireOrderHasId
  growiQuestionnaireServerOrigin: string
}

const QuestionnaireModal = ({ questionnaireOrder, growiQuestionnaireServerOrigin }: QuestionnaireModalProps): JSX.Element => {
  const { data: currentUser } = useCurrentUser();
  const lang = currentUser?.lang;

  const { data: questionnaireModalData, close: closeQuestionnaireModal } = useQuestionnaireModal();
  const isOpened = questionnaireModalData?.openedQuestionnaireId === questionnaireOrder._id;

  const { data: growiVersion } = useGrowiVersion();

  const inputNamePrefix = 'question-';

  const { t } = useTranslation();

  // TODO: モック化されている箇所を実装
  const getGrowiInfo = useCallback((): IGrowiInfo => {
    return {
      version: growiVersion || '',
      osInfo: {
        type: 'Linux',
        platform: 'linux',
        arch: 'arm',
        totalmem: 8,
      },
      appSiteUrlHashed: 'c83e8d2a1aa87b2a3f90561be372ca523bb931e2d00013c1d204879621a25b90',
      type: 'cloud',
      currentUsersCount: 100,
      currentActiveUsersCount: 50,
      wikiType: 'open',
      attachmentType: 'aws',
      activeExternalAccountTypes: 'sample account type',
      deploymentType: 'official-helm-chart',
    };
  }, [growiVersion]);

  // TODO: モック化されている箇所を実装
  const getUserInfo = useCallback((): IUserInfo | null => {
    if (currentUser) {
      return {
        userIdHash: '542bcc3bc5bc61b840017a18',
        type: currentUser.admin ? 'admin' : 'general',
        userCreatedAt: currentUser.createdAt,
      };
    }
    return null;
  }, [currentUser]);

  const sendQuestionnaireAnswer = useCallback(async(questionnaireAnswer: IQuestionnaireAnswer) => {
    try {
      await axios.post(`${growiQuestionnaireServerOrigin}/questionnaire-answer`, questionnaireAnswer);
      toastSuccess(
        <>
          <div className="font-weight-bold">{t('questionnaire.thank_you_for_answering')}</div>
          <div className="pt-2">{t('questionnaire.additional_feedback')}</div>
        </>,
        {
          autoClose: 3000,
          closeButton: true,
        },
      );
    }
    catch (e) {
      logger.error(e);
      toastError(t('questionnaire.failed_to_send'));
    }

    try {
      await apiv3Put('/questionnaire/answer', {
        user: currentUser?._id,
        questionnaireOrderId: questionnaireOrder._id,
      });
    }
    catch (e) {
      logger.error(e);
      toastError(t('questionnaire.failed_to_update_answer_status'));
    }
  }, [currentUser?._id, growiQuestionnaireServerOrigin, questionnaireOrder._id, t]);

  const submitHandler = useCallback((event) => {
    event.preventDefault();

    const growiInfo = getGrowiInfo();
    const userInfo = getUserInfo();
    const answers: IAnswer[] = questionnaireOrder.questions.map((question) => {
      const answerValue = event.target[`${inputNamePrefix + question._id}`].value;
      return { question: question._id, value: answerValue };
    });

    if (userInfo) {
      const questionnaireAnswer: IQuestionnaireAnswer = {
        growiInfo,
        userInfo,
        answers,
        answeredAt: new Date(),
      };

      sendQuestionnaireAnswer(questionnaireAnswer);
    }
    else {
      toastError(t('questionnaire.failed_to_get_user_info'));
    }

    closeQuestionnaireModal();
  }, [closeQuestionnaireModal, getGrowiInfo, getUserInfo, t, questionnaireOrder.questions, sendQuestionnaireAnswer]);

  const skipBtnClickHandler = useCallback(async() => {
    try {
      apiv3Put('/questionnaire/skip', {
        user: currentUser?._id,
        questionnaireOrderId: questionnaireOrder._id,
      });
      toastSuccess(t('questionnaire.skipped'));
    }
    catch (e) {
      logger.error(e);
      toastError(t('questionnaire.failed_to_update_answer_status'));
    }
    closeQuestionnaireModal();
  }, [closeQuestionnaireModal, currentUser?._id, questionnaireOrder._id, t]);

  const questionnaireOrderTitle = lang === 'en_US' ? questionnaireOrder.title.en_US : questionnaireOrder.title.ja_JP;

  return (<Modal
    size="lg"
    isOpen={isOpened}
    toggle={() => closeQuestionnaireModal()}
  >
    <form onSubmit={submitHandler}>
      <ModalHeader
        tag="h4"
        toggle={() => closeQuestionnaireModal()}
        className="bg-primary text-light">
        <span>{t('questionnaire.give_us_feedback')}</span>
      </ModalHeader>
      <ModalBody className="my-4">
        <div className="container">
          <h3 className="grw-modal-head">{questionnaireOrderTitle}</h3>
          <div className="row mt-4">
            <div className="col-6"></div>
            <div className="col-1 p-0 pr-2 font-weight-bold text-center align-items-center">{t('questionnaire.no_answer')}</div>
            <div className="col-5 d-flex justify-content-between align-items-center pl-2">
              <span className="font-weight-bold">{t('questionnaire.disagree')}</span>
              <span className="font-weight-bold">{t('questionnaire.agree')}</span>
            </div>
          </div>
          {questionnaireOrder.questions?.map((question) => {
            return <Question question={question} inputNamePrefix={inputNamePrefix} key={question._id}/>;
          })}
        </div>
      </ModalBody>
      <ModalFooter>
        {currentUser?.admin
        && <a href="" className="mr-auto d-flex align-items-center"><i className="material-icons mr-1">settings</i>{t('questionnaire.settings')}</a>}
        <>
          <button type="button" className="btn btn-outline-secondary mr-3" onClick={skipBtnClickHandler}>{t('questionnaire.dont_show_again')}</button>
          <button type="submit" className="btn btn-primary">{t('questionnaire.answer')}</button>
        </>
      </ModalFooter>
    </form>
  </Modal>);
};

export default QuestionnaireModal;
