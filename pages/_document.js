import React from 'react'
import Document, { Head, Main, NextScript } from 'next/document'

export default class MyDocument extends Document {
	render() {
		return (
			<html style={{ background: '#EEE', color: '#444' }}>
				<Head>
					<meta
						name="viewport"
						content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,minimal-ui"
					/>
					<meta name="theme-color" content="#673ab7" />
					<link rel="manifest" href="static/manifest.json" />
					<link
						rel="stylesheet"
						href="https://code.getmdl.io/1.3.0/material.deep_purple-blue.min.css"
					/>
					<title>Todo App</title>
				</Head>
				<body>
					<Main />
					<NextScript />
					<script defer src="https://code.getmdl.io/1.3.0/material.min.js" />
					<script
						dangerouslySetInnerHTML={{
							__html: `
							window.fbAsyncInit = function() {
								FB.init({
									appId            : '891066087729524',
									autoLogAppEvents : true,
									xfbml            : true,
									version          : 'v2.11'
								})
							};

							(function(d, s, id){
								let js, fjs = d.getElementsByTagName(s)[0];
								if (d.getElementById(id)) {return}
								js = d.createElement(s); js.id = id;
								js.src = "https://connect.facebook.net/en_US/sdk.js";
								fjs.parentNode.insertBefore(js, fjs);
							}(document, 'script', 'facebook-jssdk'));`
						}}
					/>
				</body>
			</html>
		)
	}
}
