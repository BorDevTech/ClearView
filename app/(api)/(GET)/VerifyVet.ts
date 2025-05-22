export async function GET(request: Request) {
    const params = new URLSearchParams({
        mode: '3',
        search: 'Name'
    });

    const url = `https://www.myfloridalicense.com/wl11.asp?${params.toString()}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.text(); // Changed to text() as the response might be HTML
        return new Response(data, {
            headers: {
                'Content-Type': 'text/html',
            },
        });
    } catch (error) {
        return Response.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}