import { DeepSearchResult } from './search.resolver'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import Wiki from '../../Database/Entities/wiki.entity'
import Fuse from 'fuse.js'
import { ObjectType, Field } from '@nestjs/graphql'

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

const options = {
  includeScore: true,
  includeMatches: true,
  distance: 20,
  keys: ['title'],
}

@Injectable()
class SearchService {
  constructor(
    @InjectRepository(Wiki)
    private wikisRepository: Repository<Wiki>,
    private configService: ConfigService,
  ) {}

  private url() {
    return this.configService.get('WEBSITE_URL')
  }

  async findWiki(query: string): Promise<Wiki[]> {
    return this.wikisRepository
      .createQueryBuilder('wiki')
      .select('wiki.id')
      .addSelect('wiki.title')
      .where(
        'wiki.language = :lang AND LOWER(wiki.title) LIKE :title AND hidden = :hidden',
        {
          lang: 'en',
          hidden: false,
          title: `%${query.replace(/[\W_]+/g, '%').toLowerCase()}%`,
        },
      )
      .getMany()
  }

  async wikify(queryObject: string[]): Promise<DeepSearchResult> {
    const res = queryObject.map(async e => {
      let wikiLink
      try {
        wikiLink = await this.findWiki(e)
        if (!wikiLink.length) {
          const links = await this.findLinks(e)
          return this.builder(e, wikiLink, links)
        }
        return this.builder(e, wikiLink)
      } catch (e) {
        console.log(e)
      }
    })
    return Promise.all(res) as unknown as DeepSearchResult
  }

  async deepSearch(queryString: string): Promise<[[string]]> {
    const words = queryString.split(' ')
    const validWords = words.filter(word => word.length >= 3)
    const matches = validWords.map(async word => {
      let wiki
      try {
        wiki = await this.findWiki(word)
        const v = wiki.map(x => x.id)
        return v
      } catch (e) {
        console.error(e)
      }
    })

    return (await Promise.all(matches)) as [[string]]
  }

  async uniqueIds(value: string[][]): Promise<string[]> {
    const flattenArr = value.reduce((acc, val) => acc?.concat(val || []), [])

    const duplicates = flattenArr?.filter(
      (item, index) => flattenArr.indexOf(item) !== index,
    )
    return [...new Set(duplicates)]
  }

  async findLinks(value: string) {
    const search = await this.deepSearch(value)
    const ids = await this.uniqueIds(search)
    const d = ids.map(id => {
      return { link: `${this.url()}/wiki/${id}` }
    })
    return d
  }

  async builder(
    word: string,
    wiki: Wiki[],
    links?: Link[],
  ): Promise<DeepSearchResult> {
    if (!links) {
      const fuse = new Fuse(wiki, options)
      const result = fuse.search(word)
      return {
        word,
        links: result.length
          ? [{ link: `${this.url()}/wiki/${result[0].item.id}` }]
          : [],
      } as DeepSearchResult
    }
    return {
      word,
      links,
    } as DeepSearchResult
  }
}
export default SearchService
