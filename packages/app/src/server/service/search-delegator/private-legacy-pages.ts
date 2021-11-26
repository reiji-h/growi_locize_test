import mongoose from 'mongoose';

import { PageModel, PageDocument } from '~/server/models/page';
import { SearchDelegatorName } from '~/interfaces/named-query';
import { IPage } from '~/interfaces/page';
import {
  MetaData, Result, SearchableData, SearchDelegator,
} from '../../interfaces/search';


type Data = {
  pages: IPage[]
}

class PrivateLegacyPagesDelegator implements SearchDelegator<Data> {

  name!: SearchDelegatorName.PRIVATE_LEGACY_PAGES

  async search(data: SearchableData | null, user, userGroups, option): Promise<Result<Data> & MetaData> {
    const { offset, limit } = option;

    if (offset == null || limit == null) {
      throw Error('PrivateLegacyPagesDelegator requires pagination options (offset, limit).');
    }

    // find private legacy pages
    const Page = mongoose.model('Page') as PageModel;
    const { PageQueryBuilder } = Page;

    const queryBuilder = new PageQueryBuilder(Page.find({ parent: null }));

    const pages: PageDocument[] = await queryBuilder
      .addConditionToFilteringByViewer(user, userGroups)
      .addConditionToPagenate(offset, limit)
      .query
      .lean()
      .exec();

    return {
      data: {
        pages,
      },
    };
  }

}

export default PrivateLegacyPagesDelegator;
