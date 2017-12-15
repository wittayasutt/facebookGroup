import 'isomorphic-fetch'
import React from 'react'
import withRedux from 'next-redux-wrapper'

import Fork from '../components/Fork'
import Todo from '../components/Todo'

import initStore from '../utils/store'

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
		keyword: '',
		selectedGroup: -1,
		groupResult: [],
		feed: []
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
		let _this = this

		if (groupResult.length === 0) {
			FB.api('/search', { type: 'group', q: _this.state.keyword }, response => {
				// console.log('response.data',response.data)
				_this.setState({ groupResult: response.data })
			})
		}
	}

	selectGroup = id => {
		let _this = this
		FB.api(`/${id}/feed`, { accessToken: this.state.accessToken }, response => {
			_this.setState(
				{
					feed: response.data,
					selectedGroup: id
				},
				() => {
					console.log('this.state.feed', this.state.feed)

					this.state.feed.forEach((post, index) => {
						FB.api(`/${post.id}`, { fields: 'picture' }, response => {
							if (response.picture) {
								let feed = this.state.feed
								feed[index].picture = response.picture
								_this.setState({ feed })
							}
						})
					})
				}
			)
		})
	}

	setGroup = () => {
		let { groupResult } = this.state
		let items = []

		console.log('groupResult', groupResult)

		if (groupResult.length > 0) {
			let key = 0
			groupResult.forEach(item => {
				items.push(
					<li onClick={this.selectGroup(item.id)} key={key}>
						<a>
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
		let { feed } = this.state
		let items = []

		if (feed.length > 0) {
			let key = 0
			feed.forEach(item => {
				items.push(
					<li key={key}>
						{items.message}

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

	render() {
		const { stars } = this.props
		let { login, name, keyword, selectedGroup } = this.state

		let groups = this.setGroup()
		// let feed = this.setFeed()

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

					{selectedGroup !== -1 ? (
						<div>
							x
							<ul>{}</ul>
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
