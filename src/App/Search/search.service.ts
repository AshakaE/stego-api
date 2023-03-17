import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import Wiki from '../../Database/Entities/wiki.entity'
import { DeepSearchResult, Link } from './search.resolver'

@Injectable()
class SearchService {
  constructor(
    @InjectRepository(Wiki)
    private wikisRepository: Repository<Wiki>,
    private configService: ConfigService,
  ) {}

  async findWikis(query: string): Promise<Wiki[]> {
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

  async deepSearch(queryString: string): Promise<[[string]]> {
    const words = queryString.split(' ')
    const validWords = words.filter(word => word.length >= 3)
    const matches = validWords.map(async word => {
      let wiki
      try {
        wiki = await this.findWikis(word)
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
    const url = this.configService.get('WEBSITE_URL')
    const search = await this.deepSearch(value)
    const ids = await this.uniqueIds(search)
    console.log(search)
    const d = ids.map(id => {
      return { link: `${url}/wiki/${id}` }
    })
    return d
  }

  async searchWikis(queryString: string): Promise<[Wiki]> {
    const search = await this.deepSearch(queryString)
    const ids = await this.uniqueIds(search)
    const wikis = ids.map(w => {
      return this.wikisRepository.findOne({
        where: {
          id: w,
          hidden: false,
        },
      })
    })
    return Promise.all(wikis) as unknown as [Wiki]
  }
}
export default SearchService
