const async = require('async')

var Model = function (mongoose) {
	const sha1 = require('sha1')

	var schema = new mongoose.Schema({
		ObjectId: mongoose.Schema.ObjectId,
		facebook: String,
		linkedin: String,
		twitter: String,
		facebookName: String,
		linkedinName: String,
		twitterName: String,
		avatar: { type: String, default: '/assets/images/avatar_placeholder.png' },
		wallpaper: String,
		name: String,
		nickname: String,
		intro: String,
		username: String,
		email: String,
		password: { type: String, select: false },
		phone: String,
		country: String,
		city: String,
		categories: String,
		gender: String,
		position: String,
		company: String,
		field: String,
		role: String,
		title: String,
		educa: String,
		expc: String,
		own: String,
		car: String,
		achi: String,
		consi: String,
		cy: String,
		expy: String,
		wb: String,
		hp: String,
		vl: String,
		pyh: String,
		cerci: String,
		ywab: String,
		yob: String,
		cibw: String,
		author: String,
		book: [{
			title: String,
			publication: String,
			author: [],
			retailstore: String,
		}],
		isBlocked: {
			type: Boolean,
			default: false
		},
		isAdmin: {
			type: Boolean,
			default: false
		},
		contact: {
			email: String,
			phone: String,
			skype: String,
			linkedin: String,
			fb: String,
		},
		certificates: [{
			filename: String,
			filepath: String,
		}],
		certificatesB: [{
			filename: String,
			filepath: String,
		}],
		certificatesCa: [{
			filename: String,
			filepath: String,
		}],
		certificatesE: [{
			filename: String,
			filepath: String,
		}],
		certificatesAc: [{
			filename: String,
			filepath: String,
		}],
		certificatesC: [{
			filename: String,
			filepath: String,
		}],
		downloads: [{
			filename: String,
			filepath: String,
		}],
		experience: [{
			time: String,
			place: String,
			description: String,
		}],
		notifications: {
			expert: { type: Boolean, default: true },
			journalist: { type: Boolean, default: true },
			liked: { type: Boolean, default: true },
			reacted: { type: Boolean, default: true },
		},
		color: { type: String, default: 'bronze' },
		xp: { type: Number, default: 0 },
		xpInfo: { type: Object, default: { a: 1 } },
		nextXpCronDate: Date,
		lastVisit: Date,
	})

	var getLevelInfoByXP = (xp) => {
		let level = 0,
			levelScore = 0,
			badge = 0,
			badgeLevel = 0,
			badgeMaxLevels = 10,
			xpPassed = 0,
			prevXpPassed = 0

		while (xpPassed <= xp) {
			if (badge < 10) levelScore += ((badge + 1) * 10);
			else levelScore += ((badge + 5) * 10);
			xpPassed += levelScore;
			level++;
			badgeLevel++;
			if (badgeLevel == badgeMaxLevels) {
				badge++;
				badgeLevel = 0;
				badgeMaxLevels = Math.round(badgeMaxLevels * 0.8);
				if (badge == 10) badgeMaxLevels = 100000000; // Not acheivable target for an user
			}

			if (xpPassed > xp) break
			prevXpPassed = xpPassed
		}

		return {
			level: level,
			prevLevelXp: prevXpPassed,
			nextLevelXp: xpPassed,
			xpGap: xpPassed - prevXpPassed,
			badge: badge,
		}
	}

	var setXpInfo = function (user, callback) {

		if (user) {
			user.xpInfo = getLevelInfoByXP(user.xp)

			if (user.xpInfo.level > 0 && user.xpInfo.level < 30) {
				user.color = 'bronze'
			} else if (user.xpInfo.level >= 30 && user.xpInfo.level < 60) {
				user.color = 'silver'
			} else {
				user.color = 'gold'
			}
		}
		callback(null, user)
	}

	schema.post('init', setXpInfo)

	var Model = mongoose.model('user', schema);

	return {
		setXpInfo: setXpInfo,

		removeUserById: (_id, callback) => {
			_id = MOI(_id)

			Model.findOneAndRemove({ _id }, callback);
		},

		blockUserById: (_id, callback) => {
			_id = MOI(_id)

			Model.findOne({ _id }, (err, user) => {
				user.isBlocked = true;
				user.save(callback);
			})
		},
		unblockUserById: (_id, callback) => {
			_id = MOI(_id)

			Model.findOne({ _id }, (err, user) => {
				user.isBlocked = false;
				user.save(callback);
			})
		},
		updateLastVisit: (_id, callback) => {
			_id = MOI(_id)

			Model.findOne({ _id }, (err, user) => {
				user.lastVisit = (new Date())
				user.save(callback)
			})
		},

		findAll: (callback) => {
			Model.find(callback)
		},

		findByPage: (page, count, callback) => {
			let skips = page * count;
			let query = Model.find().sort({ username: 1 }).skip(skips).limit(count);
			query.exec((err, records) => {
				return callback(err, records);
			});
		},

		findOne: (params, callback) => {
			Model.findOne(params, callback)
		},

		findById: (_id, callback) => {
			_id = MOI(_id)
			Model.findOne({ _id }, callback)
		},

		getByCredentials: (email, password, callback) => {
			password = sha1(password)

			Model.findOne({ email, password }, callback)
		},

		isPasswordValid: (_id, password, callback) => {
			if (typeof _id !== 'object') _id = mongoose.Types.ObjectId(_id)

			password = sha1(password)

			Model.findOne({ _id, password }, (err, user) => {
				if (user) return callback(true)
				else return callback(false)
			})
		},

		findByQuery: (query, callback) => {
			Model.find(query).lean().exec(callback)
			console.log('query', query)
		},

		findByEmail: (email, callback) => {
			Model.findOne({ email }, callback)
			console.log('email', email)
		},

		findByPhone: (phone, callback) => {
			Model.findOne({ phone }, callback)
		},
		findUsername: (username, callback) => {
			Model.findOne({ username }, callback)
		},

		findByEmailOrPhone: (value, callback) => {
			Model.findOne({ $or: [{ email: value }, { phone: value }] }, callback)
		},

		createUser: (params, callback) => {
			if (params.password) params.password = sha1(params.password)
			if (!params.role) params.role = 'user'

			let user = new Model()
			Object.assign(user, params)
			user.nextXpCronDate = new Date(new Date().getTime() + (7 * 24 * 60 * 60 * 1000));
			user.save(callback)
		},

		setAvatar: (_id, avatar, callback) => {
			if (typeof _id !== 'object') _id = mongoose.Schema.Types.ObjectId(_id)

			Model.findOne({ _id }, (err, user) => {
				Object.assign(user, { avatar })
				user.save(callback)
			})
		},

		setWallpaper: (_id, wallpaper, callback) => {
			if (typeof _id !== 'object') _id = mongoose.Schema.Types.ObjectId(_id)

			Model.findOne({ _id }, (err, user) => {
				Object.assign(user, { wallpaper })
				user.save(callback)
			})
		},

		addCertificate: (_id, filename, filepath, callback) => {
			if (typeof _id !== 'object') _id = mongoose.Schema.Types.ObjectId(_id)

			Model.findOne({ _id }, (err, user) => {
				user.certificates.push({ filename, filepath })
				user.save(callback)
			})
		},

		getCertificateByName: (_id, filename, callback) => {
			if (typeof _id !== 'object') _id = mongoose.Schema.Types.ObjectId(_id)

			Model.findOne({ _id }, (err, user) => {
				for (let cert of user.certificates) {
					if (cert.filename === filename) {
						return callback(cert)
					}
				}
			})
		},

		removeCertificateByName: (_id, filename, callback) => {
			if (typeof _id !== 'object') _id = mongoose.Schema.Types.ObjectId(_id)

			Model.findOne({ _id }, (err, user) => {
				user.certificates = user.certificates.filter((cert) => {
					return cert.filename != filename
				})
				user.save(callback)
			})
		},

		addDownload: (_id, filename, filepath, callback) => {
			if (typeof _id !== 'object') _id = mongoose.Schema.Types.ObjectId(_id)

			Model.findOne({ _id }, (err, user) => {
				user.downloads.push({ filename, filepath })
				user.save(callback)
			})
		},

		getDownloadByName: (_id, filename, callback) => {
			if (typeof _id !== 'object') _id = mongoose.Schema.Types.ObjectId(_id)

			Model.findOne({ _id }, (err, user) => {
				for (let cert of user.downloads) {
					if (cert.filename === filename) {
						return callback(cert)
					}
				}
			})
		},

		removeDownloadByName: (_id, filename, callback) => {
			if (typeof _id !== 'object') _id = mongoose.Schema.Types.ObjectId(_id)

			Model.findOne({ _id }, (err, user) => {
				user.downloads = user.downloads.filter((file) => {
					return file.filename != filename
				})
				user.save(callback)
			})
		},
		update: (_id, data, callback) => {
			if (typeof _id !== 'object') _id = mongoose.Types.ObjectId(_id)

			Model.findOne({ _id }, (err, user) => {
				Object.assign(user, data)
				user.save(callback)
			})
		},

		updatePassword: (_id, password, callback) => {
			_id = MOI(_id)

			Model.findOne({ _id }, (err, user) => {
				user.password = sha1(password)
				user.save(callback)
			})
		},

		updateOldPassword: (_id, password, newPassword, callback) => {
			if (typeof _id !== 'object') _id = mongoose.Types.ObjectId(_id)

			let query = { _id }

			if (password) {
				query.password = sha1(password)
			} else {
				query.password = { $in: [null, false] }
			}

			Model.findOne(query, (err, user) => {
				if (!user) {
					return callback({ message: 'User not found' })
				}

				user.password = sha1(newPassword)
				user.save(callback)
			})
		},

		updateSettings: (book, _id, name, email, phone, country, city, gender, field, language, username, callback) => {

			if (typeof _id !== 'object') _id = mongoose.Schema.Types.ObjectId(_id)


			Model.findOne({ _id }, (err, user) => {
				Object.assign(user, { name, email, phone, country, city, gender, field, language, username, book })
				user.save(callback)

			})
		},

		updateProfile: (_id, contact, experience, intro, name, title, callback) => {
			if (typeof _id !== 'object') _id = mongoose.Schema.Types.ObjectId(_id)
			if (!intro) return callback()
			intro = intro.replace(/(\n|\r\n|\n\r)/g, '<br>')

			Model.findOne({ _id }, (err, user) => {
				Object.assign(user, { contact, experience, intro, name, title })
				user.save(callback)
			})
		},
		upgradeToExpert: (_id, callback) => {
			Model.findOne({ _id }, (err, user) => {
				Object.assign(user, { role: "expert" })
				user.save(callback);
			})
			
		},

		getReactionsOnUser: (_id, callback) => {
			let result = {
				likes: 0,
				dislikes: 0,
				reacts: 0,
				following: 0,
				followers: 0,
			}

			async.parallel([
				(cb) => {
					async.waterfall([
						// Get articles made by user
						(cb) => {
							models.Article.getByUserLean(_id, (err, articles) => {
								let articlesIds = articles.map((article) => { return article._id })
								cb(null, articlesIds)
							})
						},
						// Get reactions to user's articles
						(articlesIds, cb) => {
							models.PostReaction.findLean({ post: { $in: articlesIds } }, (err, postsreactions) => {
								for (let reaction of postsreactions) {
									switch (reaction.type) {
										case 'like':
											result.likes++
											break
										case 'dislike':
											result.dislikes++
											break
									}
								}

								cb(null, articlesIds)
							})
						},
						// Get comment on user's articles
						(articlesIds, cb) => {
							models.Comment.getByArticlesLean(articlesIds, (err, comments) => {
								result.reacts = comments.length
								cb()
							})
						}
					], (err) => {
						cb()
					})
				},
				(cb) => {
					models.Follow.followingByFollower(_id, null, null, null, (err, following) => {
						result.following = following.length
						cb()
					})
				},
				(cb) => {
					models.Follow.followersByFollowing(_id, null, null, null, (err, followers) => {
						result.followers = followers.length
						cb()
					})
				},
				(cb) => {
					models.Friendship.friends(_id, (err, friends) => {
						result.friends = friends.length
						cb()
					})
				},
			], (err) => {
				callback(result)
			})
		},

		updateNotificationsSettings: (_id, expert, journalist, liked, reacted, callback) => {
			Model.findOne({ _id }, (err, user) => {
				Object.assign(user.notifications, { expert, journalist, liked, reacted })
				user.save(callback)
			})
		},

		doesHavePassword: (_id, callback) => {
			Model.findOne({ _id }, { password: 1 }, (err, user) => {
				callback(err, !!user.password)
			})
		},

		getRandomUsers: (user, filter, count, callback) => {
			user = MOI(user)

			Model.aggregate([
				{ $match: filter },
				{ $sample: { size: count } }
			]).exec((err, users) => {
				async.mapSeries(users, setXpInfo, callback)
			})
		},

		search: (user, q, role, skip = 0, limit = 5, nicknameSearch = false, callback) => {
			skip = Number(skip)
			limit = Number(limit)

			user = MOI(user)

			// let roleQuery = {$ne: 'user'}
			// if (role) roleQuery = role

			let query = {
			}

			if (nicknameSearch) query.username = new RegExp(q, 'gi')
			else query.name = new RegExp(q, 'gi')
			models.BlockedUser.getBlockedByUser(user, (err, blockeds) => {
				var blockedIds = blockeds.map((b) => b._id)
				blockedIds.push(user)
				query['_id'] = { $nin: blockedIds }
				console.log(query);
				Model.find(query).lean().skip(skip).limit(limit).exec((err, users) => {
					async.mapSeries(users, setXpInfo, callback)
				})
			})
		},
		adminSearch: (user, q, role, skip = 0, limit = 5, nicknameSearch = false, callback) => {
			skip = Number(skip)
			limit = Number(limit)

			user = MOI(user)

			// let roleQuery = {$ne: 'user'}
			// if (role) roleQuery = role

			let query = {}


			query.name = new RegExp(q, 'gi')
			Model.find(query).lean().skip(skip).limit(limit).exec((err, users) => {
				if (err) return callback(err);
				Model.count(query).exec((error, result) => {
					callback(error, users, result)
				})

			})
		},
		searchFriendsAndFollowersNicknames: (executorID, options, callback) => {
			if (!options || !options.query) return [];
			if (typeof executorID !== 'object') executorID = mongoose.Types.ObjectId(executorID)
			async.waterfall([
				(next) => {
					async.parallel({
						friends: cb => {
							models.Friendship.friends(executorID, (err, friendsIDS) => {
								return cb(null, friendsIDS)
							})
						},
						followed: cb => {
							models.Follow.followedByUser(executorID, { lean: true }, (err, followedIDS) => {
								return cb(null, followedIDS);
							})
						}
					}, (err, ids) => {
						next(err, ids);
					})
				}
			], (err, usersIds) => {
				let friendsIds = (usersIds.friends) ? usersIds.friends.map(MOI) : usersIds.friends
				let followedIds = (usersIds.followed) ? usersIds.followed.map(MOI) : usersIds.followed
				let dbQuery = Model.find({
					$or: [
						{
							$and: [
								{ nickname: { $regex: options.query, $options: 'gi' } },
								{ role: 'expert' },
								{ _id: { $in: followedIds } }
							]
						},
						{
							$and: [
								{ nickname: { $regex: options.query, $options: 'gi' } },
								{ _id: { $in: friendsIds } }
							]
						}
					]
				}, 'nickname')
				if (options.limit) dbQuery.limit(options.limit)
				dbQuery.exec((err, results) => {
					if (err) callback(err, [])
					else callback(null, results)
				})
			})
		},

		/**
		 * Get users list by nicknames array
		 * @param nicknames Array
		 * @returns Promise
		 * */
		getUsersByNicknames: nicknames => {
			return new Promise((resolve, reject) => {
				if (!nicknames || nicknames.length < 1) return resolve([])
				Model.find({ nickname: { $in: nicknames } }).exec((err, users) => {
					if (err) return reject(err)
					resolve(users)
				})
			})
		},

		findByCronScheduledToday: (callback) => {
			var now = new Date();
			var startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
			var endOfToday = new Date(startOfToday.getTime() + (24 * 60 * 60 * 1000));
			let query = Model.find({
				$and: [
					{ role: { $ne: 'user' } },
					{
						$or: [
							{
								$and: [
									{ nextXpCronDate: { $gte: startOfToday } },
									{ nextXpCronDate: { $lt: startOfToday } },
								],
							},
							{ nextXpCronDate: { $eq: null } },
						],
					},
				],
			});
			query.exec((err, records) => {
				return callback(err, records);
			});
		},
	}
}

module.exports = Model
