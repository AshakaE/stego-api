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

@ObjectType()
class Link {
  @Field(() => String)
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
class DeepSearchResult {
  @Field(() => String)
  word!: string

  @Field(() => [Link])
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
  ) {}

  @Query(() => [SearchResult])
  async searchWiki() {
    return [{ word: 'About bitcoin', link: 'https://iq.wiki/wiki/bitcoin' }]
  }

  @Query(() => [WikiC], { nullable: true })
  async wikisIds() {
    return this.wikisRepository.find({
      select: ['id', 'updated'],
      where: {
        hidden: false,
      },
    })
  }

  @Query(() => [DeepSearchResult], { nullable: true })
  async findWiki(@Args() args: ByIdArgs) {
    const obj = [
      'Line Break Test',
      'frax price index fpi',
      'blockchain',
      '3Landers NFT',
      'Frax Share',
      'Kevin Wang',
      'summary of the wiki',
      'Suchet Dhindsa Salvesen',
      'Golem network',
      'network golem',
      'Not found',
      'coin frax bit',
    ]

    const res = obj.map(async e => {
      let wikiLink
      try {
        wikiLink = await this.wikisRepository
          .createQueryBuilder('wiki')
          .select('wiki.id')
          .where(
            'wiki.language = :lang AND LOWER(wiki.title) LIKE :title AND hidden = :hidden',
            {
              lang: 'en',
              hidden: false,
              title: `%${e.replace(/[\W_]+/g, '%').toLowerCase()}%`,
            },
          )
          .getOne()
        if (!wikiLink) {
          //deep search
          const a = await this.deepSearch(e)
          return a
        }
        return {
          word: e,
          links: [{ link: `https://iq.wiki/wiki/${wikiLink.id}` }],
        } as DeepSearchResult
      } catch (e) {
        console.log(e)
      }
    })
    const a = await Promise.all(res)
    console.log(a)
    return res
  }

  @Query(() => DeepSearchResult, { nullable: true })
  async deepSearch(val: string) {
    //split word
    //word must have space inbetween and atleast 3 characters long
    // val = 'coin frax bit'
    const words = val.split(' ')

    const matches = words.map(async w => {
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
    console.log(v)
    return { word: val, links: ag } as unknown as DeepSearchResult

  }
}

export default SearchResolver
