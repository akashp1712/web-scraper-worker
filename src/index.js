export default {
	async fetch(request, env, ctx) {

		const authHeader = request.headers.get('Authorization');

		if (!authHeader || authHeader !== `Bearer ${env.AUTH_TOKEN}`) {
			return new Response('Unauthorized', { status: 401 });
		}

		const url = new URL(request.url);
		const targetUrl = url.searchParams.get('url');
		const waitTime = parseInt(url.searchParams.get('wait') || '0', 10);
	
		if (!targetUrl) {
			return new Response('Please provide a URL to scrape in the "url" query parameter.', { status: 400 });
		}
	
		try {
			const response = await fetch(targetUrl);
			const html = await response.text();
	
			// Wait for specified time (if any)
			if (waitTime > 0) {
			await new Promise(resolve => setTimeout(resolve, waitTime));
			}
	
			// Simple parsing using regex
			const title = html.match(/<title>(.*?)<\/title>/i)?.[1] || 'No title found';
			const bodyContent = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] || '';
			
			// Extract text from paragraphs and headings
			const contentRegex = /<(p|h[1-6])[^>]*>([\s\S]*?)<\/\1>/gi;
			const content = [];
			let match;
			while ((match = contentRegex.exec(bodyContent)) !== null) {
			const text = match[2].replace(/<[^>]*>/g, '').trim();
			if (text) content.push(text);
			}
	
			// If no content found, try to extract any text from the body
			if (content.length === 0) {
			const bodyText = bodyContent.replace(/<[^>]*>/g, '').trim();
			if (bodyText) content.push(bodyText);
			}
	
			const result = {
			title: title,
			content: content,
			url: targetUrl
			};
	
			return new Response(JSON.stringify(result, null, 2), {
			headers: { 'Content-Type': 'application/json' }
			});
	
		} catch (error) {
			return new Response(`Error scraping the webpage: ${error.message}`, { status: 500 });
		}
		},
	};