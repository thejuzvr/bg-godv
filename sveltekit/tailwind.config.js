/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				// Elder Scrolls inspired colors
				'skyrim-blue': '#2C5F9F',
				'skyrim-gold': '#D4AF37',
				'skyrim-dark': '#1a1a1a',
				'skyrim-gray': '#3a3a3a'
			}
		}
	},
	plugins: [require('daisyui')],
	daisyui: {
		themes: [
			{
				skyrim: {
					primary: '#2C5F9F',
					secondary: '#D4AF37',
					accent: '#8B4513',
					neutral: '#3a3a3a',
					'base-100': '#1a1a1a',
					'base-200': '#2a2a2a',
					'base-300': '#3a3a3a',
					info: '#3abff8',
					success: '#36d399',
					warning: '#fbbd23',
					error: '#f87272'
				}
			},
			'dark',
			'cupcake'
		]
	}
};
