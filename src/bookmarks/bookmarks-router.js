const express = require('express')
const { v4: uuid } = require('uuid')
const logger = require('../logger')
const { bookmarks } = require('../store')
const app = require('../app')
const bookmarksRouter = express.Router()
const jsonParser = express.json()
const BookmarksService = require('./bookmarks-service')
const { isWebUri } = require('valid-url')
const xss = require('xss')



const serializeBookmark = bookmark => ({
  id: bookmark.id,
  title: xss(bookmark.title),
  url: bookmark.url,
  description: xss(bookmark.description),
  rating: Number(bookmark.rating),
})

// route for /bookmarks
bookmarksRouter
  .route('/api/bookmarks')
  .get((req, res, next) => {
    BookmarksService.getAllBookmarks(req.app.get('db'))
      .then(bookmarks => {
        res.json(bookmarks.map(serializeBookmark))
      })
      .catch(next)
  })

  .post(jsonParser, (req, res, next) => {
    for (const field of ['title', 'url', 'rating']) {
      if (!req.body[field]) {
        logger.error(`${field} is required`)
        return res.status(400).send(`'${field}' is required`)

      }
    }
    const { title, description, rating, url } = req.body;


    const ratingNumber = Number(rating)

    if (ratingNumber < 0 || ratingNumber > 5 || !Number.isInteger(ratingNumber)) {
      return res
        .status(400)
        .send(`'rating' must be a number between 0 and 5`)
    }

    if (!isWebUri(url)) {
      logger.error(`Invalid url '${url}' supplied`)
      return res
        .status(400)
        .send(`'url' must be a valid URL`)
    }


    const id = uuid();

    const bookmark = {
      id,
      title,
      url,
      description,
      rating
    }

    BookmarksService.insertBookmark(
      req.app.get('db'),
      newBookmark
    )
      .then(bookmark => {
        logger.info(`Bookmark with id ${bookmark.id} created.`)
        res
          .status(201)
          .location(`/api/bookmarks/${bookmark.id}`)
          .json(serializeBookmark(bookmark))
      })
      .catch(next)
  })


//routes for /bookmarks/id

bookmarksRouter
  .route('/api/bookmarks/:id')
  .all((req, res, next) => {
    const { id } = req.params
    BookmarksService.getById(req.app.get('db'), id)
      .then(bookmark => {
        if (!bookmark) {
          logger.error(`Bookmark with id ${id} not found.`)
          return res.status(404).json({
            error: { message: `Bookmark Not Found` }
          })
        }
        res.json(serializeBookmark(bookmark))
      })
      .catch(next)
  })
  .get((req, res) => {
    res.json(serializeBookmark(res.bookmark))
  })
  .delete((req, res, next) => {
    const { bookmark_id } = req.params
    BookmarksService.deleteBookmark(
      req.app.get('db'),
      bookmark_id
    )
      .then(numRowsAffected => {
        logger.info(`Bookmark with id ${bookmark_id} deleted.`)
        res.status(204).end()
      })
      .catch(next)
  })

  .patch(jsonParser, (req, res, next) => {
    const { title, url, description, rating } = req.body
    const bookmarkToUpdate = { title, url, description, rating }

    const numberofValues = Object.values(bookmarkToUpdate).filter(Boolean).length
    if (numberofValues === 0) {
      logger.error(`Invalid update without required fieds`)
      return res.send(400).json({
        error: {
          message: `Request body must content either 'title', 'url, 'description', or 'rating'`
        }
      })
    }

    const error = getBookmarkValidationError(bookmarkToUpdate)

    if (error) return res.status(400).send(error)

    BookmarksService.updateBookmark(
      req.app.get('db'),
      req.params.bookmark_id,
      bookmarkToUpdate
    )
      .then(numRowsAffected => {
        res.status(204).end()
      })
      .catch(next)
  })



  
module.exports = bookmarksRouter;