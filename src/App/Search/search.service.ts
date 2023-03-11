import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import Wiki from '../../Database/Entities/wiki.entity'
import { DeepSearchResult } from './search.resolver'

@Injectable()
class SearchService {
  constructor(
    @InjectRepository(Wiki)
    private wikisRepository: Repository<Wiki>,
  ) {}

  async deepSearch(queryString: string): Promise<[[string]]> {
    const words = queryString.split(' ')
    const validWords = words.filter(word => word.length >= 3)
    const matches = validWords.map(async word => {
      let wiki
      try {
        wiki = await this.wikisRepository
          .createQueryBuilder('wiki')
          .select('wiki.id')
          .where(
            'wiki.language = :lang AND LOWER(wiki.title) LIKE :title AND hidden = :hidden',
            {
              lang: 'en',
              hidden: false,
              title: `%${word.replace(/[\W_]+/g, '%').toLowerCase()}%`,
            },
          )
          .getMany()
        const v = wiki.map(x => x.id)
        return v
      } catch (e) {
        console.error(e)
      }
    })

    return (await Promise.all(matches)) as [[string]]
  }
}
export default SearchService
