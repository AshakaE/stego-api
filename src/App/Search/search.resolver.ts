import {
  Resolver,
  Field,
  ObjectType,
  Query,
  Args,
} from '@nestjs/graphql'
import Wiki from '../../Database/Entities/wiki.entity'
import SearchService, { Link } from './search.service'

@ObjectType()
export class DeepSearchResult {
  @Field(() => String)
  word!: string

  @Field(() => [Link], { nullable: true })
  links!: [Link]
}

@Resolver(() => DeepSearchResult)
class SearchResolver {
  constructor(private searchService: SearchService) {}

  @Query(() => [DeepSearchResult], { nullable: true })
  async findLinks(
    @Args('queryObject', { type: () => [String] }) queryObject: string[],
  ) {
    return this.searchService.wikify(queryObject)
  }

  @Query(() => [Wiki], { nullable: true })
  async searchWikis(
    @Args('queryString', { type: () => String }) queryString: string,
  ) {
    return this.searchService.searchWikis(queryString)
  }
}

export default SearchResolver
