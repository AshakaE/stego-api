# Database Search Engine & Wikify API
# Description

This project covers two parts a simple db search engine for [wikis](https://iq.wiki) and a simple link builder for an array of possible [wikis](https://iq.wiki) string ids. It's intended to be used in conjunction with [wikis](https://iq.wiki) but the logic behind can be applied to your own personal project


DB search engine: 
A user can search for [wiki](https://iq.wiki) without having the correct order of words or id. Under the hood it queries for each word and intersects the common values amongst the result to form a final result of wikis that have at least one word existing in each wiki id

#### `Example query` :

`query args`
```json
{
   "queryString": " coin frax bit bi"
}
```
`query` 
```js
query searchWikis($queryString: String!) {
  searchWikis(queryString: $queryString) {
    id
    categories {
      id
    }
  }
}
```
`query result` 
```json
{
  "data": {
    "searchWikis": [
      {
        "id": "frax-stablecoin",
        "categories": [
          {
            "id": "cryptocurrencies"
          }
        ]
      },
      {
        "id": "bitcoin-diamond",
        "categories": [
          {
            "id": "cryptocurrencies"
          }
        ]
      },
      {
        "id": "wrapped-bitcoin-wbtc",
        "categories": [
          {
            "id": "cryptocurrencies"
          }
        ]
      }
    ]
  }
}
```

Wikify (Link builder): The idea behind this is to speed up the process of citing [wikis](https://iq.wiki) when creating wikis. When writing wikis, an editor has the option of highlighting all words or string of words that they intend to cite from [wikis](https://iq.wiki), the api expects an array of strings and performs a db search like the one above, but the result is a array of objects with each and their respective wiki links.

### `Example query` :

`query args`
```json
{
    {
        "queryObject": ["usD Binance", "Line Break Test", "frax price index fpi", "blockchain", "3Landers NFT", "Frax Share", "Kevin Wang", "summary of the wiki", "Suchet Dhindsa Salvesen", "Golem network", "network golem", "Not found", "coin frax bit" ]
    }
}
```
`query` 
```js
query findLinks($queryObject: [String!]!) {
  findLinks(queryObject: $queryObject) {
    word
    links {
      link
    }
  }
}
```
`query result` 
```json
{
  "data": {
    "findLinks": [
      {
        "word": "usD Binance",
        "links": [
          {
            "link": "https://iq.wiki/wiki/busd"
          }
        ]
      },
      {
        "word": "Line Break Test",
        "links": [
          {
            "link": "https://iq.wiki/wiki/line-break-test"
          }
        ]
      },
      {
        "word": "frax price index fpi",
        "links": [
          {
            "link": "https://iq.wiki/wiki/frax-price-index-fpi"
          }
        ]
      },
      {
        "word": "blockchain",
        "links": [
          {
            "link": "https://iq.wiki/wiki/blockchain"
          }
        ]
      },
      {
        "word": "3Landers NFT",
        "links": [
          {
            "link": "https://iq.wiki/wiki/3landers-nft"
          }
        ]
      },
      {
        "word": "Frax Share",
        "links": [
          {
            "link": "https://iq.wiki/wiki/frax-share"
          }
        ]
      },
      {
        "word": "Kevin Wang",
        "links": [
          {
            "link": "https://iq.wiki/wiki/kevin-wang"
          }
        ]
      },
      {
        "word": "summary of the wiki",
        "links": [
          {
            "link": "https://iq.wiki/wiki/summary-of-the-wiki"
          }
        ]
      },
      {
        "word": "Suchet Dhindsa Salvesen",
        "links": [
          {
            "link": "https://iq.wiki/wiki/suchet-dhindsa-salvesen"
          }
        ]
      },
      {
        "word": "Golem network",
        "links": [
          {
            "link": "https://iq.wiki/wiki/golem-network"
          }
        ]
      },
      {
        "word": "network golem",
        "links": [
          {
            "link": "https://iq.wiki/wiki/golem-network"
          }
        ]
      },
      {
        "word": "Not found",
        "links": []
      },
      {
        "word": "coin frax bit",
        "links": [
          {
            "link": "https://iq.wiki/wiki/frax-stablecoin"
          },
          {
            "link": "https://iq.wiki/wiki/bitcoin-diamond"
          },
          {
            "link": "https://iq.wiki/wiki/wrapped-bitcoin-wbtc"
          }
        ]
      }
    ]
  }
}
```

## Installation

```bash
$ yarn install
```

## Running the app

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

