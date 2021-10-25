import React, { FC } from 'react';
import PropTypes from 'prop-types';
import SearchResultListItem from './SearchResultListItem';

export type Page = {
  _id: string;
  snippet: string;
  path: string;
  revision: string;
  noLink: boolean;
  lastUpdateUser: any;
}

type Props = {
  pages: Page[],
  deletionMode: boolean,
  selectedPages: Page[],
  onClickInvoked?: (pageId: string) => void,
}

const SearchResultList: FC<Props> = (props:Props) => {
  return (
    <>
      {props.pages.map((page) => {
        return (
          <SearchResultListItem
            page={page}
            onClickInvoked={props.onClickInvoked}
          />
        );
      })}
    </>
  );

};

SearchResultList.propTypes = {
  pages: PropTypes.array.isRequired,
  deletionMode: PropTypes.bool.isRequired,
  selectedPages: PropTypes.array.isRequired,
  onClickInvoked: PropTypes.func,
};

export default SearchResultList;
