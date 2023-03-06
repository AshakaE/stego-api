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
import Language from '../../Database/Entities/language.entity'

@ObjectType()
class SearchResult {
  @Field(() => String)
  word!: string

  @Field(() => String)
  link!: string
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

  @Query(() => [SearchResult], { nullable: true })
  async findWiki(@Args() args: ByIdArgs) {
    console.log(args.id)
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
        console.log(wikiLink)
        // }
        if (!wikiLink) {
          return {
            word: e,
            link: `NOT FOUND`,
          } as SearchResult
        }
        return {
          word: e,
          link: `https://iq.wiki/wiki/${wikiLink.id}`,
        } as SearchResult
      } catch (e) {
        console.log(e)
      }
      // if(wikiLink) {
    })

    return res 
    return this.wikisRepository.findOne({
      where: {
        // language: 'en',
        id: args.id,
      },
    })
  }
}

export default SearchResolver
