var angular = require('angular')
require('angular-moment')
require('angular-modal')

window.numeral = require('numeral')
window.async = require('async')

// angular.module('er', ['ngRoute', 'ngSanitize', 'angularMoment', 'ngCookies', 'er.controllers', 'er.services', 'er.directives', 'satellizer'])
// .config(['$locationProvider', '$routeProvider', '$authProvider',
angular.module('er', [
	require('angular-route'), require('angular-sanitize'), require('angular-cookies'), 'angularMoment', require('satellizer'),
	'btford.modal',
	'er.controllers', 'er.services', 'er.directives', 'er.modals'])
.config(['$locationProvider', '$routeProvider', '$authProvider',
	function config($locationProvider, $routeProvider, $authProvider) {
		$locationProvider.hashPrefix('!')
		$routeProvider
			.when('/start', {
				templateUrl: 'assets/views/landing.htm'
			})
			.when('/confirmsignup', {
				templateUrl: 'assets/views/confirm-signup.htm'
			})
			.when('/', {
				templateUrl: 'assets/views/home.htm'
			})
			.when('/my', {
				templateUrl: 'assets/views/profile.htm'
			})
			.when('/resetpassword', {
				templateUrl: 'assets/views/resetpassword.htm'
			})


		$authProvider.facebook({
			clientId: 685381251615066
		})

		$authProvider.linkedin({
			clientId: '77cidth7sa053d',
			redirectUri: 'http://localhost:8006/auth/linkedin'
		});
	}
])
.run(function ($rootScope, $templateCache) {
	$templateCache.removeAll()
})