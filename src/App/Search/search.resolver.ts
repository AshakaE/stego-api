import {
  Resolver,
  Field,
  ObjectType,
  Query,
  ArgsType,
  GraphQLISODateTime,
  Args,
} from '@nestjs/graphql'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import Wiki from '../../Database/Entities/wiki.entity'
import SearchService from './search.service'

import Fuse from 'fuse.js'

const options = {
  includeScore: true,
  includeMatches: true,
  distance: 20,
  keys: ['title'],
}

@ObjectType()
export class Link {
  @Field(() => String, { nullable: true })
  link!: string
}
@ObjectType()
class SearchResult {
  @Field(() => String)
  word!: string

  @Field(() => String)
  link!: string
}
@ObjectType()
export class DeepSearchResult {
  @Field(() => String)
  word!: string

  @Field(() => [Link], { nullable: true })
  links!: [Link]
}

@ObjectType()
class WikiC {
  @Field(() => String)
  id!: string

  @Field(() => GraphQLISODateTime)
  updated!: Date
}

@ArgsType()
export class ByIdArgs {
  @Field(() => String)
  id!: string

  @Field(() => String)
  lang = 'en'
}

@Resolver(() => SearchResult)
class SearchResolver {
  constructor(
    @InjectRepository(Wiki)
    private wikisRepository: Repository<Wiki>,
    private searchService: SearchService,
  ) {}

  @Query(() => [WikiC], { nullable: true })
  async wikisIds() {
    return this.wikisRepository.find({
      select: ['id', 'updated'],
      where: {
        hidden: false,
      },
    })
  }

  @Query(() => [Wiki], { nullable: true })
  async randomSearch(@Args('query', { type: () => String }) query: string) {
    const r = await this.searchService.searchWikis(query)
    console.log(r)
    return r
  }

  @Query(() => [DeepSearchResult], { nullable: true })
  async findWiki(@Args('query', { type: () => String }) query: string) {
    const r = await this.searchService.findLinks(query)
    console.log(r)
    return r
  }

  @Query(() => [DeepSearchResult], { nullable: true })
  async findLinks(
    @Args('queryObject', { type: () => [String] }) queryObject: string[],
  ) {
    const res = queryObject.map(async e => {
      let wikiLink
      try {
        wikiLink = await this.searchService.findWikis(e)
        if (!wikiLink.length) {
          //deep search
          const links = await this.searchService.findLinks(e)
          return {
            word: e,
            links,
          } as DeepSearchResult
        }
        if (wikiLink.length) {
          const fuse = new Fuse(wikiLink, options)
          const result = fuse.search(e)
          return {
            word: e,
            links: [{ link: `https://iq.wiki/wiki/${result[0].item.id}` }],
          } as DeepSearchResult
        }
      } catch (e) {
        console.log(e)
      }
    })
    const a = await Promise.all(res)
    return Promise.all(res)
  }

  @Query(() => DeepSearchResult, { nullable: true })
  async deepSearch(val: string) {
    const b = await this.searchService.findLinks(val)
    const c = await this.searchService.searchWikis(val)
    const words = val.split(' ')
    const validWords = words.filter(word => word.length >= 3)
    const matches = validWords.map(async w => {
      let r
      try {
        r = await this.wikisRepository
          .createQueryBuilder('wiki')
          .select('wiki.id')
          .where(
            'wiki.language = :lang AND LOWER(wiki.title) LIKE :title AND hidden = :hidden',
            {
              lang: 'en',
              hidden: false,
              title: `%${w.replace(/[\W_]+/g, '%').toLowerCase()}%`,
            },
          )
          .getMany()

        const v = r.map(x => `https://iq.wiki/wiki/${x.id}`)

        return v
      } catch (e) {
        console.error(e)
      }
    })
    const k = await Promise.all(matches)

    const flattenArr = k.reduce((acc, val) => acc?.concat(val || []), [])

    const duplicates = flattenArr?.filter(
      (item, index) => flattenArr.indexOf(item) !== index,
    )
    const uniqueDuplicates = [...new Set(duplicates)]

    const ag = uniqueDuplicates.map(r => {
      return { link: r } as Link
    })

    const v = { word: val, links: ag } as DeepSearchResult
    // console.log(v)
    return { word: val, links: b } as unknown as DeepSearchResult
  }
}

export default SearchResolver
