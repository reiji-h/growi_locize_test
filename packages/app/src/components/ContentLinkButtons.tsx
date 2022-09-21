import React, { useCallback, useMemo } from 'react';

import { smoothScrollIntoView } from '~/client/util/smooth-scroll';
import styles from '~/components/ContentLinkButtons.module.scss';
import { RecentlyCreatedIcon } from '~/components/Icons/RecentlyCreatedIcon';
import { usePageUser } from '~/stores/context';


const WIKI_HEADER_LINK = 120;

export const ContentLinkButtons = (): JSX.Element => {

  const { data: pageUser } = usePageUser();

  // get element for smoothScroll
  const getBookMarkListHeaderDom = useMemo(() => { return document.getElementById('bookmarks-list') }, []);
  const getRecentlyCreatedListHeaderDom = useMemo(() => { return document.getElementById('recently-created-list') }, []);


  const BookMarkLinkButton = useCallback((): JSX.Element => {
    if (getBookMarkListHeaderDom == null) {
      return <></>;
    }

    return (
      <button
        type="button"
        className="btn btn-outline-secondary btn-sm px-2"
        onClick={() => smoothScrollIntoView(getBookMarkListHeaderDom, WIKI_HEADER_LINK)}
      >
        <i className="fa fa-fw fa-bookmark-o"></i>
        <span>Bookmarks</span>
      </button>
    );
  }, [getBookMarkListHeaderDom]);

  const RecentlyCreatedLinkButton = useCallback(() => {
    if (getRecentlyCreatedListHeaderDom == null) {
      return <></>;
    }

    return (
      <button
        type="button"
        className="btn btn-outline-secondary btn-sm px-3"
        onClick={() => smoothScrollIntoView(getRecentlyCreatedListHeaderDom, WIKI_HEADER_LINK)}
      >
        <i className={`${styles['grw-icon-container-recently-created']} grw-icon-container-recently-created mr-2`}><RecentlyCreatedIcon /></i>
        <span>Recently Created</span>
      </button>
    );
  }, [getRecentlyCreatedListHeaderDom]);

  if (pageUser == null || pageUser.name === '') {
    return <></>;
  }

  return (
    <div className="mt-3 d-flex justify-content-between">
      <BookMarkLinkButton />
      <RecentlyCreatedLinkButton />
    </div>
  );
};
