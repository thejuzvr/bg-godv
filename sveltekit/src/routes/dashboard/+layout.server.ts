import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ cookies, fetch }) => {
	const sessionToken = cookies.get('session_token');

	if (!sessionToken) {
		throw redirect(303, '/login');
	}

	try {
		// Get current user
		const userRes = await fetch('http://localhost:5000/api/auth/me', {
			headers: {
				Cookie: `session_token=${sessionToken}`
			}
		});

		if (!userRes.ok) {
			throw redirect(303, '/login');
		}

		const userData = await userRes.json();

		// Get character
		const charRes = await fetch(`http://localhost:5000/api/characters/${userData.user.id}`, {
			headers: {
				Cookie: `session_token=${sessionToken}`
			}
		});

		if (!charRes.ok) {
			// No character yet, redirect to creation
			throw redirect(303, '/create-character');
		}

		const charData = await charRes.json();

		return {
			user: userData.user,
			character: charData.character
		};
	} catch (error) {
		if (error instanceof Response) throw error; // Re-throw redirects
		console.error('Dashboard load error:', error);
		throw redirect(303, '/login');
	}
};
