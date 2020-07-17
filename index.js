const axios = require('axios')
const cheerio = require('cheerio')

const MITURL = 'https://mitpress.mit.edu'

const getOpenAccessBooks = async (page) => {
  const { data } = await axios.get(`${MITURL}/mit-press-open?page=${page}`)
  const $ = cheerio.load(data)
  const books = $('.results__list li a')
    .map((i, el) => $(el).attr('href'))
    .toArray()
    .map((url) => (url.startsWith(MITURL) ? url.slice(MITURL.length) : url))
    .map((url) => url.split('#')[0])
  return Array.from(new Set(books.filter((url) => url.startsWith('/books/'))))
}

const getBook = async (bookUrl) => {
  const { data } = await axios.get(`${MITURL}${bookUrl}`)
  const $ = cheerio.load(data)
  return {
    title: $('h1.book__title').text().trim(),
    authors: $('.book__authors').text().trim(),
    img: $('.book__cover img.book__img').attr('src'),
    link: $('.open-access-rail__block a')
      .map((i, el) => ({
        text: $(el).text().trim().split('  ')[0],
        url: $(el).attr('href')
      }))
      .toArray()[0]
  }
}

;(async () => {
  for (let page = 0; ; page++) {
    const books = await getOpenAccessBooks(page)
    if (books.length === 0) break
    for (let i = 0; i < books.length; i++) {
      try {
        const book = await getBook(books[i])
        if (book) {
          console.log(
            [
              `## ${book.title}`,
              `${book.authors}`,
              `[${book.link.text}](${book.link.url})`,
              '',
              book.img ? `<img width="200" src="${MITURL}${book.img}"></img>` : '',
              ''
            ].join('\n')
          )
        }
      } catch (e) {
        console.error(books[i], e.response.status)
      }
    }
  }
})()
