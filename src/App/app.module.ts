import { ApolloDriverConfig, ApolloDriver } from '@nestjs/apollo'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { GraphQLModule } from '@nestjs/graphql'
import { TypeOrmModule } from '@nestjs/typeorm'
import DatabaseModule from '../Database/database.module'
import Wiki from '../Database/Entities/wiki.entity'
import SearchResolver from './Search/search.resolver'
import SearchService from './Search/search.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([Wiki]),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      playground: true,
      cors: true,
      autoSchemaFile: true,
    }),
    DatabaseModule,
  ],
  controllers: [],
  providers: [SearchResolver, SearchService],
})
export class AppModule {}
