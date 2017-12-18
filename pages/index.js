import 'isomorphic-fetch'
import React from 'react'
import withRedux from 'next-redux-wrapper'

import Fork from '../components/Fork'
import Todo from '../components/Todo'

import initStore from '../utils/store'
import moment from 'moment'
import _ from 'lodash'

class Index extends React.Component {
	static async getInitialProps({ store }) {
		// Adding a default/initialState can be done as follows:
		// store.dispatch({ type: 'ADD_TODO', text: 'It works!' });
		const res = await fetch(
			'https://api.github.com/repos/ooade/NextSimpleStarter'
		)
		const json = await res.json()

		return { stars: json.stargazers_count }
	}

	state = {
		login: false,
		accessToken: null,
		name: '',
		since: moment()
			.subtract({ days: 7 })
			.format(),
		time: moment()
			.subtract({ minutes: 30 })
			.format(),
		keyword: '',
		selectedGroup: -1,
		selectedPost: -1,
		groupResult: [],
		feed: [],
		comment: [],
		loading: false,
		interval: null
	}

	componentDidMount() {
		const _this = this

		setInterval(() => {
			let { selectedGroup } = _this.state
			if (selectedGroup !== -1) {
				_this.selectGroup(selectedGroup)
			}
		}, 10000)
	}

	fbStatus = () => {
		let _this = this
		FB.getLoginStatus(function(response) {
			if (response.status === 'connected') {
				_this.setState({
					login: true,
					accessToken: response.authResponse.accessToken
				})

				FB.api('/me', function(response) {
					_this.setState({
						name: response.name
					})
				})

				FB.api(`/${response.authResponse.userID}/permissions`, function(
					response
				) {
					console.log('response', response)
				})
			} else {
				_this.setState({
					login: false
				})
			}
		})
	}

	fbLogin = () => {
		let _this = this
		FB.login(function(response) {
			_this.fbStatus()
		})
	}

	fbLogout = () => {
		FB.logout()
	}

	findFbGroup = e => {
		e.preventDefault()
		let { keyword, groupResult } = this.state
		let _this = this

		FB.api('/search', { type: 'group', q: keyword }, response => {
			if (response)
				_this.setState({
					selectedGroup: -1,
					groupResult: response.data
				})
		})
	}

	selectGroup = id => {
		let _this = this
		this.setState({ loading: true })

		FB.api(
			`/${id}/feed`,
			{ accessToken: this.state.accessToken, since: this.state.since },
			response => {
				if (response) {
					_this.setState(
						{
							feed: response.data,
							selectedGroup: id
						},
						() => {
							this.state.feed.forEach((post, index) => {
								FB.api(
									`/${post.id}`,
									{ fields: 'picture, created_time' },
									response => {
										let feed = this.state.feed
										feed[index].created_time = response.created_time
										if (response.picture) feed[index].picture = response.picture

										_this.setState({ feed, loading: false })
									}
								)
							})
						}
					)
				}
			}
		)
	}

	closeGroup = () => {
		this.setState({
			selectedGroup: -1,
			feed: []
		})
	}

	seeComment = id => {
		let _this = this
		FB.api(`/${id}/comments`, {}, response => {
			this.setState(
				{
					selectedPost: id,
					comment: response.data
				},
				() => {
					this.state.comment.forEach((comment, index) => {
						FB.api(`/${comment.id}/comments`, {}, response => {
							let comment = this.state.comment
							comment[index].reply = response.data
							_this.setState({ comment })
						})
					})
				}
			)
		})
	}

	setGroup = () => {
		let { selectedGroup, groupResult } = this.state
		let items = []

		if (selectedGroup === -1 && groupResult.length > 0) {
			let key = 0
			groupResult.forEach(item => {
				items.push(
					<li key={key}>
						<a onClick={e => this.selectGroup(item.id)}>
							[{item.privacy}] {item.name}
						</a>

						<style jsx>{`
							a {
								cursor: pointer;
							}
							a:hover {
								text-decoration: underline;
							}
						`}</style>
					</li>
				)
				key++
			})
		}

		return items
	}

	setFeed = () => {
		let { time, selectedPost, feed } = this.state
		let items = []

		if (feed.length > 0) {
			_.sortBy(feed, [post => post.updated_time])
			feed.forEach((item, index) => {
				items.push(
					<div className="demo-card-wide mdl-card mdl-shadow--2dp" key={index}>
						{item.picture ? (
							<div className="mdl-card__title">
								<img className="image" src={item.picture} alt={item.message} />
							</div>
						) : null}
						<div className="mdl-card__supporting-text">
							{item.message} - updated time{' '}
							{moment(item.updated_time).format('HH:mm:ss D MMM YYYY')}&nbsp;
							{moment(item.created_time).diff(time, 'seconds') > 0 ? (
								<span className="new-post">NEW</span>
							) : null}
						</div>
						<div className="mdl-card__actions mdl-card--border">
							{selectedPost === item.id ? (
								this.setComment()
							) : (
								<a
									className="mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect"
									onClick={e => this.seeComment(item.id)}>
									Comment
								</a>
							)}
						</div>

						<style jsx>{`
							.demo-card-wide {
								min-height: auto;
								width: 100%;
								margin-top: 2rem;
							}
							.new-post {
								background: #448aff;
								color: #ffffff;
								padding: 2px 8px;
							}
							.image {
								width: 100%;
							}
						`}</style>
					</div>
				)

				if (selectedPost === -1 && index === 0) {
					this.seeComment(item.id)
				}
			})
		}

		return items
	}

	setComment = () => {
		let { time, comment } = this.state
		let items = []

		if (comment.length > 0) {
			comment.forEach((item, index) => {
				const newRep =
					moment(item.created_time).diff(time, 'seconds') > 0
						? 'mdl-chip mdl-chip--contact mdl-badge mdl-badge--overlap'
						: 'mdl-chip mdl-chip--contact'

				items.push(
					<span className={newRep} data-badge="N" key={index}>
						<span className="mdl-chip__contact mdl-color--teal mdl-color-text--white">
							C
						</span>
						<span className="mdl-chip__text">{item.message}</span>

						<style jsx>{`
							.mdl-chip--contact {
								display: block;
							}
						`}</style>
					</span>
				)

				if (item.reply) {
					item.reply.forEach((rep, rIndex) => {
						const newRep =
							moment(rep.created_time).diff(time, 'seconds') > 0
								? 'mdl-chip mdl-chip--contact mdl-badge mdl-badge--overlap'
								: 'mdl-chip mdl-chip--contact'

						items.push(
							<span className={newRep} data-badge="N" key={rIndex}>
								<span className="mdl-chip__contact mdl-color--red mdl-color-text--white">
									R
								</span>
								<span className="mdl-chip__text">{rep.message}</span>

								<style jsx>{`
									.mdl-chip--contact {
										display: block;
										margin-left: 1.5rem;
									}
								`}</style>
							</span>
						)
					})
				}
			})
		}

		return items
	}

	render() {
		const { stars } = this.props
		let { login, name, keyword, selectedGroup, loading } = this.state

		let groups = this.setGroup()
		let feed = this.setFeed()

		if (!login) {
			return (
				<div className="mdl-card">
					<button
						className="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--accent"
						onClick={this.fbLogin}>
						login
					</button>

					<style jsx>{`
						.mdl-card {
							width: 30vw;
							display: flex;
							flex-direction: column;
							justify-content: center;
							margin: 1rem auto 0;
							padding: 1rem;
						}

						.mdl-card > button {
							width: 300px;
							margin: auto;
						}
					`}</style>
				</div>
			)
		} else {
			return (
				<div className="mdl-card">
					<h5>Hello, {name}</h5>
					<button
						className="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--accent"
						onClick={this.fbLogout}>
						logout
					</button>
					<form onSubmit={this.findFbGroup}>
						<div className="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
							<input
								type="text"
								value={keyword}
								onInput={e => this.setState({ keyword: e.target.value })}
								className="mdl-textfield__input"
								id="input"
							/>

							<label className="mdl-textfield__label" htmlFor="input">
								Find group ...
							</label>
						</div>
					</form>

					{loading ? (
						<div>loading...</div>
					) : selectedGroup !== -1 ? (
						<div>
							<span className="close" onClick={e => this.closeGroup()}>
								x
							</span>
							{feed}
						</div>
					) : (
						<ul>{groups}</ul>
					)}

					<style jsx>{`
						.mdl-card {
							width: 30vw;
							display: flex;
							flex-direction: column;
							justify-content: center;
							margin: 1rem auto 0;
							padding: 1rem;
						}
						.mdl-card > h5 {
							display: flex;
							justify-content: center;
						}
						.mdl-card > button {
							width: 300px;
							margin: auto;
						}
						.mdl-card > form {
							margin: auto;
						}
						.mdl-card li {
							cursor: pointer;
						}
						.mdl-card li:hover {
							text-decoration: underline;
						}
						.mdl-card span.close {
							float: right;
							cursor: pointer;
						}
						.mdl-card span.close:hover {
							opacity: 0.8;
						}
					`}</style>
				</div>
			)
		}

		// <div>
		// 	<Fork stars={stars} />
		// 	<div>
		// 		<Todo />
		// 	</div>
		// </div>
	}
}

export default withRedux(initStore)(Index)
