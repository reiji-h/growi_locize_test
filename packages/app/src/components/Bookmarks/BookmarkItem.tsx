import React, { useCallback, useEffect, useState } from 'react';

import nodePath from 'path';

import { DevidedPagePath, pathUtils } from '@growi/core';
import { useDrag } from 'react-dnd';
import { useTranslation } from 'react-i18next';
import { UncontrolledTooltip, DropdownToggle } from 'reactstrap';

import { unbookmark } from '~/client/services/page-operation';
import { toastError, toastSuccess } from '~/client/util/apiNotification';
import { apiv3Put } from '~/client/util/apiv3-client';
import { BookmarkFolderItems } from '~/interfaces/bookmark-info';
import { IPageHasId, IPageInfoAll, IPageToDeleteWithMeta } from '~/interfaces/page';
import { useSWRxBookamrkFolderAndChild } from '~/stores/bookmark-folder';

import ClosableTextInput, { AlertInfo, AlertType } from '../Common/ClosableTextInput';
import { MenuItemType, PageItemControl } from '../Common/Dropdown/PageItemControl';


type Props = {
  bookmarkedPage: IPageHasId,
  onUnbookmarked: () => void,
  onRenamed: () => void,
  onClickDeleteMenuItem: (pageToDelete: IPageToDeleteWithMeta) => void,
  parentFolder: BookmarkFolderItems
}

const BookmarkItem = (props: Props): JSX.Element => {
  const { t } = useTranslation();
  const {
    bookmarkedPage, onUnbookmarked, onRenamed, onClickDeleteMenuItem, parentFolder,
  } = props;
  const [isRenameInputShown, setRenameInputShown] = useState(false);
  const dPagePath = new DevidedPagePath(bookmarkedPage.path, false, true);
  const { latter: pageTitle, former: formerPagePath } = dPagePath;
  const bookmarkItemId = `bookmark-item-${bookmarkedPage._id}`;
  const [parentId, setParentId] = useState(parentFolder._id);
  const { mutate: mutateParentBookmarkData } = useSWRxBookamrkFolderAndChild();
  const { mutate: mutateChildFolderData } = useSWRxBookamrkFolderAndChild(parentId);


  useEffect(() => {
    if (parentId != null) {
      mutateChildFolderData();
    }
  }, [parentId, mutateChildFolderData]);

  const bookmarkMenuItemClickHandler = useCallback(async() => {
    await unbookmark(bookmarkedPage._id);
    onUnbookmarked();
  }, [onUnbookmarked, bookmarkedPage]);

  const renameMenuItemClickHandler = useCallback(() => {
    setRenameInputShown(true);
  }, []);

  const inputValidator = (title: string | null): AlertInfo | null => {
    if (title == null || title === '' || title.trim() === '') {
      return {
        type: AlertType.WARNING,
        message: t('form_validation.title_required'),
      };
    }

    return null;
  };

  const pressEnterForRenameHandler = useCallback(async(inputText: string) => {
    const parentPath = pathUtils.addTrailingSlash(nodePath.dirname(bookmarkedPage.path ?? ''));
    const newPagePath = nodePath.resolve(parentPath, inputText);
    if (newPagePath === bookmarkedPage.path) {
      setRenameInputShown(false);
      return;
    }

    try {
      setRenameInputShown(false);
      await apiv3Put('/pages/rename', {
        pageId: bookmarkedPage._id,
        revisionId: bookmarkedPage.revision,
        newPagePath,
      });
      onRenamed();
      toastSuccess(t('renamed_pages', { path: bookmarkedPage.path }));
    }
    catch (err) {
      setRenameInputShown(true);
      toastError(err);
    }
  }, [bookmarkedPage, onRenamed, t]);

  const deleteMenuItemClickHandler = useCallback(async(_pageId: string, pageInfo: IPageInfoAll | undefined): Promise<void> => {
    if (bookmarkedPage._id == null || bookmarkedPage.path == null) {
      throw Error('_id and path must not be null.');
    }

    const pageToDelete: IPageToDeleteWithMeta = {
      data: {
        _id: bookmarkedPage._id,
        revision: bookmarkedPage.revision as string,
        path: bookmarkedPage.path,
      },
      meta: pageInfo,
    };

    onClickDeleteMenuItem(pageToDelete);
  }, [bookmarkedPage, onClickDeleteMenuItem]);

  const [, bookmarkItemDragRef] = useDrag({
    type: 'BOOKMARK',
    item:  bookmarkedPage,
    end: (item) => {
      if (parentFolder.parent == null) {
        mutateParentBookmarkData();
      }
      if (parentId != null) {
        setParentId(parentFolder.parent);
        mutateChildFolderData();
      }
    },
    collect: monitor => ({
      isDragging: monitor.isDragging(),
      canDrag: monitor.canDrag(),
    }),
  });


  return (
    <li
      className="bookmark-item-list list-group-item list-group-item-action border-0 py-0 pr-3 d-flex align-items-center"
      key={bookmarkedPage._id} ref={(c) => { bookmarkItemDragRef(c) }}
      id={bookmarkItemId}
    >
      { isRenameInputShown ? (
        <ClosableTextInput
          value={nodePath.basename(bookmarkedPage.path ?? '')}
          placeholder={t('Input page name')}
          onClickOutside={() => { setRenameInputShown(false) }}
          onPressEnter={pressEnterForRenameHandler}
          inputValidator={inputValidator}
        />
      ) : (
        <a href={`/${bookmarkedPage._id}`} className="grw-foldertree-title-anchor flex-grow-1 pr-3">
          <p className={`text-truncate m-auto ${bookmarkedPage.isEmpty && 'grw-sidebar-text-muted'}`}>{pageTitle}</p>
        </a>
      )}
      <PageItemControl
        pageId={bookmarkedPage._id}
        isEnableActions
        forceHideMenuItems={[MenuItemType.DUPLICATE]}
        onClickBookmarkMenuItem={bookmarkMenuItemClickHandler}
        onClickRenameMenuItem={renameMenuItemClickHandler}
        onClickDeleteMenuItem={deleteMenuItemClickHandler}
      >
        <DropdownToggle color="transparent" className="border-0 rounded btn-page-item-control p-0 grw-visible-on-hover mr-1">
          <i className="icon-options fa fa-rotate-90 p-1"></i>
        </DropdownToggle>
      </PageItemControl>
      <UncontrolledTooltip
        modifiers={{ preventOverflow: { boundariesElement: 'window' } }}
        autohide={false}
        placement="right"
        target={bookmarkItemId}
        fade={false}
      >
        { formerPagePath !== null ? `${formerPagePath}/` : '/' }
      </UncontrolledTooltip>
    </li>
  );
};

export default BookmarkItem;
