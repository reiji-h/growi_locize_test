import React from 'react';

import { IUserHasId } from '@growi/core';
import {
  NextPage, GetServerSideProps, GetServerSidePropsContext,
} from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import dynamic from 'next/dynamic';
import Head from 'next/head';

import CountBadge from '~/components/Common/CountBadge';
import PageListIcon from '~/components/Icons/PageListIcon';
import { ShareLinkLayout } from '~/components/Layout/ShareLinkLayout';
import GrowiContextualSubNavigation from '~/components/Navbar/GrowiContextualSubNavigation';
import { Page } from '~/components/Page';
import styles from '~/components/Page/DisplaySwitcher.module.scss'; // for PageList toc style
import { DrawioViewerScript } from '~/components/Script/DrawioViewerScript';
import TableOfContents from '~/components/TableOfContents';
import { SupportedAction, SupportedActionType } from '~/interfaces/activity';
import { CrowiRequest } from '~/interfaces/crowi-request';
import { RendererConfig } from '~/interfaces/services/renderer';
import { IShareLinkHasId } from '~/interfaces/share-link';
import {
  useCurrentUser, useCurrentPathname, useCurrentPageId, useRendererConfig, useIsSearchPage,
  useShareLinkId, useIsSearchServiceConfigured, useIsSearchServiceReachable, useIsSearchScopeChildrenAsDefault, useDrawioUri, useIsContainerFluid,
} from '~/stores/context';
import { useDescendantsPageListModal } from '~/stores/modal';
import loggerFactory from '~/utils/logger';

import {
  CommonProps, getServerSideCommonProps, generateCustomTitle, getNextI18NextConfig,
} from '../utils/commons';

const logger = loggerFactory('growi:next-page:share');

const ShareLinkAlert = dynamic(() => import('~/components/Page/ShareLinkAlert'), { ssr: false });
const ForbiddenPage = dynamic(() => import('~/components/ForbiddenPage'), { ssr: false });

type Props = CommonProps & {
  shareLink?: IShareLinkHasId,
  isExpired: boolean,
  disableLinkSharing: boolean,
  isSearchServiceConfigured: boolean,
  isSearchServiceReachable: boolean,
  isSearchScopeChildrenAsDefault: boolean,
  drawioUri: string | null,
  rendererConfig: RendererConfig,
};

const SharedPage: NextPage<Props> = (props: Props) => {
  useIsSearchPage(false);
  useShareLinkId(props.shareLink?._id);
  useCurrentPageId(props.shareLink?.relatedPage._id);
  useCurrentUser(props.currentUser);
  useCurrentPathname(props.currentPathname);
  useRendererConfig(props.rendererConfig);
  useIsSearchServiceConfigured(props.isSearchServiceConfigured);
  useIsSearchServiceReachable(props.isSearchServiceReachable);
  useIsSearchScopeChildrenAsDefault(props.isSearchScopeChildrenAsDefault);
  useDrawioUri(props.drawioUri);
  useIsContainerFluid(props.isContainerFluid);

  const { open: openDescendantPageListModal } = useDescendantsPageListModal();
  const { t } = useTranslation();

  const isNotFound = props.shareLink == null || props.shareLink.relatedPage == null || props.shareLink.relatedPage.isEmpty;
  const isShowSharedPage = !props.disableLinkSharing && !isNotFound && !props.isExpired;
  const shareLink = props.shareLink;

  const title = generateCustomTitle(props, 'GROWI');

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      <DrawioViewerScript />

      <ShareLinkLayout>
        <div className="h-100 d-flex flex-column justify-content-between">
          <header className="py-0 position-relative">
            {isShowSharedPage && <GrowiContextualSubNavigation isLinkSharingDisabled={props.disableLinkSharing} />}
          </header>

          <div id="grw-fav-sticky-trigger" className="sticky-top"></div>

          <div className="flex-grow-1">
            <div id="content-main" className="content-main">
              <div className="grw-container-convertible">
                { props.disableLinkSharing && (
                  <div className="mt-4">
                    <ForbiddenPage isLinkSharingDisabled={props.disableLinkSharing} />
                  </div>
                )}

                { (isNotFound && !props.disableLinkSharing) && (
                  <div className="container-lg">
                    <h2 className="text-muted mt-4">
                      <i className="icon-ban" aria-hidden="true" />
                      <span> Page is not found</span>
                    </h2>
                  </div>
                )}

                { (props.isExpired && !props.disableLinkSharing && shareLink != null) && (
                  <div className="container-lg">
                    <ShareLinkAlert expiredAt={shareLink.expiredAt} createdAt={shareLink.createdAt} />
                    <h2 className="text-muted mt-4">
                      <i className="icon-ban" aria-hidden="true" />
                      <span> Page is expired</span>
                    </h2>
                  </div>
                )}

                {(isShowSharedPage && shareLink != null) && (
                  <>
                    <ShareLinkAlert expiredAt={shareLink.expiredAt} createdAt={shareLink.createdAt} />
                    <div className="d-flex flex-column flex-lg-row-reverse">

                      <div className="grw-side-contents-container">
                        <div className="grw-side-contents-sticky-container">

                          {/* Page list */}
                          <div className={`grw-page-accessories-control ${styles['grw-page-accessories-control']}`}>
                            { shareLink.relatedPage.path != null && (
                              <button
                                type="button"
                                className="btn btn-block btn-outline-secondary grw-btn-page-accessories
                                rounded-pill d-flex justify-content-between align-items-center"
                                onClick={() => openDescendantPageListModal(shareLink.relatedPage.path)}
                                data-testid="pageListButton"
                              >
                                <div className="grw-page-accessories-control-icon">
                                  <PageListIcon />
                                </div>
                                {t('page_list')}
                                <CountBadge count={shareLink.relatedPage.descendantCount} offset={1} />
                              </button>
                            ) }
                          </div>

                          <div className="d-none d-lg-block">
                            <TableOfContents />
                          </div>
                        </div>
                      </div>

                      <div className="flex-grow-1 flex-basis-0 mw-0">
                        <Page />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </ShareLinkLayout>
    </>
  );
};

function injectServerConfigurations(context: GetServerSidePropsContext, props: Props): void {
  const req: CrowiRequest = context.req as CrowiRequest;
  const { crowi } = req;
  const { configManager, searchService, xssService } = crowi;

  props.disableLinkSharing = configManager.getConfig('crowi', 'security:disableLinkSharing');

  props.isSearchServiceConfigured = searchService.isConfigured;
  props.isSearchServiceReachable = searchService.isReachable;
  props.isSearchScopeChildrenAsDefault = configManager.getConfig('crowi', 'customize:isSearchScopeChildrenAsDefault');

  props.drawioUri = configManager.getConfig('crowi', 'app:drawioUri');

  props.rendererConfig = {
    isEnabledLinebreaks: configManager.getConfig('markdown', 'markdown:isEnabledLinebreaks'),
    isEnabledLinebreaksInComments: configManager.getConfig('markdown', 'markdown:isEnabledLinebreaksInComments'),
    adminPreferredIndentSize: configManager.getConfig('markdown', 'markdown:adminPreferredIndentSize'),
    isIndentSizeForced: configManager.getConfig('markdown', 'markdown:isIndentSizeForced'),

    plantumlUri: process.env.PLANTUML_URI ?? null,
    blockdiagUri: process.env.BLOCKDIAG_URI ?? null,

    // XSS Options
    isEnabledXssPrevention: configManager.getConfig('markdown', 'markdown:xss:isEnabledPrevention'),
    attrWhiteList: xssService.getAttrWhiteList(),
    tagWhiteList: xssService.getTagWhiteList(),
    highlightJsStyleBorder: configManager.getConfig('crowi', 'customize:highlightJsStyleBorder'),
  };
}

async function injectNextI18NextConfigurations(context: GetServerSidePropsContext, props: Props, namespacesRequired?: string[] | undefined): Promise<void> {
  const nextI18NextConfig = await getNextI18NextConfig(serverSideTranslations, context, namespacesRequired);
  props._nextI18Next = nextI18NextConfig._nextI18Next;
}

function getAction(props: Props): SupportedActionType {
  let action: SupportedActionType;
  if (props.isExpired) {
    action = SupportedAction.ACTION_SHARE_LINK_EXPIRED_PAGE_VIEW;
  }
  else if (props.shareLink == null) {
    action = SupportedAction.ACTION_SHARE_LINK_NOT_FOUND;
  }
  else {
    action = SupportedAction.ACTION_SHARE_LINK_PAGE_VIEW;
  }

  return action;
}

async function addActivity(context: GetServerSidePropsContext, action: SupportedActionType): Promise<void> {
  const req: CrowiRequest = context.req as CrowiRequest;

  const parameters = {
    ip: req.ip,
    endpoint: req.originalUrl,
    action,
    user: req.user?._id,
    snapshot: {
      username: req.user?.username,
    },
  };

  await req.crowi.activityService.createActivity(parameters);
}

export const getServerSideProps: GetServerSideProps = async(context: GetServerSidePropsContext) => {
  const req = context.req as CrowiRequest<IUserHasId & any>;
  const { crowi, params } = req;
  const result = await getServerSideCommonProps(context);

  if (!('props' in result)) {
    throw new Error('invalid getSSP result');
  }
  const props: Props = result.props as Props;

  try {
    const ShareLinkModel = crowi.model('ShareLink');
    const shareLink = await ShareLinkModel.findOne({ _id: params.linkId }).populate('relatedPage');
    if (shareLink != null) {
      props.isExpired = shareLink.isExpired();
      props.shareLink = shareLink.toObject();
    }
  }
  catch (err) {
    logger.error(err);
  }

  injectServerConfigurations(context, props);
  await injectNextI18NextConfigurations(context, props);
  await addActivity(context, getAction(props));

  return {
    props,
  };
};

export default SharedPage;
