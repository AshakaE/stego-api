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

  async findWiki(query: string, fullWiki: boolean): Promise<Wiki[]> {
    const queryBuilder = this.wikisRepository
      .createQueryBuilder('wiki')
      .where(
        'wiki.language = :lang AND LOWER(wiki.title) LIKE :title AND hidden = :hidden',
        {
          lang: 'en',
          hidden: false,
          title: `%${query.replace(/[\W_]+/g, '%').toLowerCase()}%`,
        },
      )

    const result = fullWiki
      ? await queryBuilder.getMany()
      : await queryBuilder.select('wiki.id').addSelect('wiki.title').getMany()

    return result
  }

  async wikify(queryObject: string[]): Promise<DeepSearchResult> {
    const res = queryObject.map(async e => {
      let wikiLink
      try {
        wikiLink = await this.findWiki(e, false)
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

  async deepSearch(
    queryString: string,
    fullWiki: boolean,
  ): Promise<[[Wiki]] | [[string]]> {
    const words = queryString.trim().split(' ')
    const validWords = words.filter(word => word.length > 2)
    const matches = validWords.map(async word => {
      let wiki
      try {
        wiki = await this.findWiki(word, fullWiki)
        const ids = wiki.map(x => x.id)
        return fullWiki ? wiki : ids
      } catch (e) {
        console.error(e)
      }
    })
    return fullWiki
      ? ((await Promise.all(matches)) as [[Wiki]])
      : ((await Promise.all(matches)) as [[string]])
  }

  async intersectWikis(value: Wiki[][]): Promise<Wiki[]> {
    const flattenArr = value.reduce((acc, val) => acc?.concat(val || []), [])

    const duplicates = flattenArr.filter((item, index, arr) => {
      for (let i = 0; i < arr.length; i++) {
        if (i != index && arr[i].id == item.id) {
          return true
        }
      }
      return false
    })
    console.log(duplicates)
    const deduplicated = [
      ...duplicates
        .reduce((map, wiki) => {
          return map.set(`${wiki.id}`, wiki)
        }, new Map())
        .values(),
    ]
    console.log(deduplicated)
    return deduplicated
  }

  async intersectIds(value: string[][]): Promise<string[]> {
    const flattenArr = value.reduce((acc, val) => acc?.concat(val || []), [])

    const duplicates = flattenArr?.filter(
      (item, index) => flattenArr.indexOf(item) !== index,
    )
    return [...new Set(duplicates)]
  }

  async findLinks(value: string): Promise<Link[]> {
    const search = await this.deepSearch(value, false)
    const ids = await this.intersectIds(search as string[][])
    return ids.map(id => {
      return { link: `${this.url()}/wiki/${id}` }
    })
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

  async searchWikis(query: string): Promise<Wiki[]> {
    const search = await this.deepSearch(query, true)
    const wikis = await this.intersectWikis(search as Wiki[][])
    return wikis
  }
}
export default SearchService
