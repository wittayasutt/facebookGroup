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
		APPID: '891066087729524',
		login: false,
		accessToken: null,
		name: '',
		keyword: '',
		groupResult: ''
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
		console.log(_this.state.keyword)

		FB.api('/search', { type: 'group', q: _this.state.keyword }, response => {
			_this.setState({ groupResult: response.data })

			console.log(_this.state.groupResult)
		})
	}

	render() {
		const { stars } = this.props
		let { login, name, keyword } = this.state

		if (!login) {
			return (
				<div className="container">
					<button
						className="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--accent"
						onClick={this.fbLogin}>
						login
					</button>

					<style jsx>{`
						.container {
							width: 20vw;
							display: flex;
							flex-direction: column;
							justify-content: center;
							margin: 1rem auto 0;
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

					<style jsx>{`
						.mdl-card {
							width: 25vw;
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
