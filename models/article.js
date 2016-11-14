var Model = function(mongoose) {
	var schema = new mongoose.Schema({
		ObjectId	: mongoose.Schema.ObjectId,
		author		: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'user',
		},
		images		: [String],
		text		: String,
		createdAt	: {type: Date, default: Date.now},
	})

	var Model = mongoose.model('article', schema);

	return {
		create: (author, text, images, callback) => {
			if (typeof author !== 'object') author = mongoose.Schema.Types.ObjectId(author)

			text = text.replace(/(\n|\r\n|\n\r)/g, '<br>')

			let article = new Model()
			Object.assign(article, {
				author, images, text,
			})
			article.save(callback)
		},

		getAll: (callback) => {
			Model.find().select('-__v').populate('author').sort({createdAt: 'desc'}).exec(callback)
		},

		getByUser: (author, callback) => {
			if (typeof author !== 'object') author = mongoose.Types.ObjectId(author)

			Model.find({author}).select('-__v').populate('author').sort({createdAt: 'desc'}).exec(callback)
		},

		getLikedOfUser: (author, callback) => {
			if (typeof author !== 'object') author = mongoose.Types.ObjectId(author)

			Model.find({author}).populate('author').sort({createdAt: 'desc'}).exec((err, articles) => {
				let postIds = articles.map((article) => {return article._id})

				let likedArticles = []

				models.PostReaction.getByPostIds(author, postIds, (err, reactions) => {
					articles.filter((article) => {
						let postReactions = reactions[article._id.toString()].reactions

						if (postReactions.expert.likes + postReactions.journalist.likes + postReactions.user.likes > 0) {
							return true
						}

						return false
					})

					likedArticles = articles
					callback(err, likedArticles)
				})
			})
		},

		getDislikedOfUser: (author, callback) => {
			if (typeof author !== 'object') author = mongoose.Types.ObjectId(author)

			Model.find({author}).populate('author').sort({createdAt: 'desc'}).exec((err, articles) => {
				let postIds = articles.map((article) => {return article._id})

				let likedArticles = []

				models.PostReaction.getByPostIds(author, postIds, (err, reactions) => {
					articles.filter((article) => {
						let postReactions = reactions[article._id.toString()].reactions

						if (postReactions.expert.dislikes + postReactions.journalist.dislikes + postReactions.user.dislikes > 0) {
							return true
						}

						return false
					})

					likedArticles = articles
					callback(err, likedArticles)
				})
			})
		},

		getCommentedOfUser: (author, callback) => {
			if (typeof author !== 'object') author = mongoose.Types.ObjectId(author)

			Model.find({author}).populate('author').sort({createdAt: 'desc'}).exec((err, articles) => {
				let postIds = articles.map((article) => {return article._id})

				let commentedArticles = []

				models.Comment.getByArticles(postIds, (err, comments) => {
					for (let comment of comments) {
						let articleFound = false

						for (let article of commentedArticles) {
							if (comment.post.toString() == article._id.toString()) {
								articleFound = true
								break
							}
						}

						if (!articleFound) {
							for (let article of articles) {
								if (comment.post.toString() == article._id.toString()) {
									commentedArticles.push(article)
									break
								}
							}
						}
					}

					callback(err, commentedArticles)
				})
			})
		},
	}
}

module.exports = Model