import 'isomorphic-fetch'
import React from 'react'
import withRedux from 'next-redux-wrapper'

import Fork from '../components/Fork'
import Todo from '../components/Todo'

import initStore from '../utils/store'
import moment, { locale } from 'moment'
import _ from 'lodash'
import Chart from 'chart.js'

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
		since: moment()
			.subtract({ days: 7 })
			.format(),
		time: moment()
			.subtract({ minutes: 30 })
			.format(),
		name: '',
		keyword: '',
		filter: null,
		selectedGroup: -1,
		selectedPost: -1,
		groupResult: [],
		feed: [],
		comment: [],
		loading: false,
		interval: null,
		chart: {},
		showChart: 'none'
	}

	componentDidMount() {
		const _this = this

		setInterval(() => {
			let { selectedGroup } = _this.state
			if (selectedGroup !== -1) {
				console.log('update')
				_this.selectGroup(selectedGroup)
			}
		}, 10000)
	}

	componentDidUpdate(nextProps, nextState) {
		const { filter, selectedGroup, feed, chart } = this.state

		if (filter !== nextState.filter) {
			// if (filter !== nextState.filter || feed !== nextState.feed) {
			console.log('feed', feed)

			if (filter !== null && filter !== '' && selectedGroup !== -1) {
				const chart = this.setChart(chart)

				console.log('chart', chart)

				var ctx = document.getElementById('myChart').getContext('2d')
				var myChart = new Chart(ctx, {
					type: 'line',
					data: {
						labels: chart.labels,
						datasets: [
							{
								label: 'mention',
								data: chart.data,
								backgroundColor: [
									'rgba(255, 99, 132, 0.2)',
									'rgba(54, 162, 235, 0.2)',
									'rgba(255, 206, 86, 0.2)',
									'rgba(75, 192, 192, 0.2)',
									'rgba(153, 102, 255, 0.2)',
									'rgba(255, 159, 64, 0.2)'
								],
								borderColor: [
									'rgba(255,99,132,1)',
									'rgba(54, 162, 235, 1)',
									'rgba(255, 206, 86, 1)',
									'rgba(75, 192, 192, 1)',
									'rgba(153, 102, 255, 1)',
									'rgba(255, 159, 64, 1)'
								],
								borderWidth: 1
							}
						]
					},
					options: {}
				})
			}
		}
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
		let { keyword, selectedGroup } = this.state
		let _this = this

		if (keyword !== '' && selectedGroup === -1) {
			FB.api('/search', { type: 'group', q: keyword }, response => {
				if (response)
					_this.setState({
						keyword: '',
						selectedGroup: -1,
						groupResult: response.data
					})
			})
		} else if (keyword !== '') {
			_this.setState({ filter: keyword, showChart: '' })
		}
	}

	selectGroup = id => {
		let _this = this
		this.setState({ loading: true })

		FB.api(
			`/${id}/feed`,
			{ accessToken: this.state.accessToken, since: this.state.since },
			response => {
				if (response) {
					response.data.forEach((post, index) => {
						FB.api(
							`/${post.id}`,
							{ fields: 'picture, created_time' },
							response2 => {
								let feed = response.data
								feed[index].created_time = response2.created_time
								if (response.picture) feed[index].picture = response2.picture

								_this.setState({ feed, selectedGroup: id, loading: false })
							}
						)
					})
				}
			}
		)
	}

	closeGroup = () => {
		this.setState({
			keyword: '',
			filter: null,
			selectedGroup: -1,
			feed: [],
			showChart: 'none'
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

		if (selectedGroup === -1 && groupResult && groupResult.length > 0) {
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
		let {
			time,
			selectedGroup,
			selectedPost,
			feed,
			keyword,
			filter
		} = this.state
		let items = []

		if (feed && feed.length > 0) {
			_.sortBy(feed, [post => post.updated_time])
			feed.forEach((item, index) => {
				if (
					!filter ||
					(filter && (item.message && item.message.indexOf(filter) !== -1))
				) {
					items = this.addPost(items, item, index, time, selectedPost)
				}

				if (selectedPost === -1 && index === 0) {
					this.seeComment(item.id)
				}
			})
		}

		return items
	}

	addPost = (items, item, index, time, selectedPost) => {
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

		return items
	}

	setChart = () => {
		let { feed, filter } = this.state
		let chart = {}

		if (feed && feed.length > 0) {
			feed.forEach((item, index) => {
				if (
					!filter ||
					(filter && (item.message && item.message.indexOf(filter) !== -1))
				) {
					chart = this.addChart(chart, item)
				}
			})
		}

		let c = {}
		c.labels = []
		c.data = []

		const keys = Object.keys(chart)
		const sortedKeys = _.sortBy(keys)
		const sortedChart = _.fromPairs(_.map(sortedKeys, key => [key, chart[key]]))

		for (const key of Object.keys(sortedChart)) {
			c.labels.push(key)
			c.data.push(sortedChart[key])
		}

		return c
	}

	addChart = (chart, item) => {
		console.log('item', item)
		console.log('item', Object.keys(item))
		console.log('created_time', item['created_time'])
		const date = moment(item.created_time).format('DD-MM-YYYY')
		console.log('date', date)

		if (chart[date]) {
			chart[date]++
		} else {
			chart[date] = 0
			chart[date]++
		}

		return chart
	}

	setComment = () => {
		let { time, comment, filter } = this.state
		let items = []
		let key = 0

		if (comment && comment.length > 0) {
			comment.forEach(item => {
				const newComment =
					moment(item.created_time).diff(time, 'seconds') > 0
						? 'mdl-chip mdl-chip--contact mdl-badge mdl-badge--overlap'
						: 'mdl-chip mdl-chip--contact'

				items.push(
					<span className={newComment} data-badge="N" key={key}>
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
					item.reply.forEach(rep => {
						key++
						const newRep =
							moment(rep.created_time).diff(time, 'seconds') > 0
								? 'mdl-chip mdl-chip--contact mdl-badge mdl-badge--overlap'
								: 'mdl-chip mdl-chip--contact'

						items.push(
							<span className={newRep} data-badge="N" key={key}>
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
				key++
			})
		}

		return items
	}

	render() {
		const { stars } = this.props
		let {
			login,
			name,
			keyword,
			filter,
			selectedGroup,
			loading,
			showChart
		} = this.state

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
								{selectedGroup === -1 ? 'Find group ...' : 'Filter keyword ...'}
							</label>
						</div>
					</form>

					{loading ? (
						<div>
							loading...
							<canvas
								id="myChart"
								className={showChart}
								width="400"
								height="400"
							/>
						</div>
					) : selectedGroup !== -1 ? (
						<div>
							<span className="close" onClick={e => this.closeGroup()}>
								x
							</span>
							<canvas
								id="myChart"
								className={showChart}
								width="400"
								height="400"
							/>
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
						.none {
							display: none;
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
