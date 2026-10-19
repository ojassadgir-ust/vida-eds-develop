let cityListPromise;

function loadCities(url) {
    if (!url) return Promise.resolve([]);
    if (!cityListPromise) {
        cityListPromise = fetch(url)
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then((data) => data.flatMap(
                (s) => s.cities.map((city) => ({
                    label: city,
                    city,
                    state: s.state,
                })),
            ))
            .catch((e) => {
                cityListPromise = undefined;
                throw e;
            });
    }

    return cityListPromise;
}

export async function fetchCities(query, url) {
    const q = query.trim().toLowerCase();
    if (q?.length < 2) return [];
    const all = await loadCities(url);
    const starts = [];
    const words = [];

    all.forEach((c) => {
        const l = c.label.toLowerCase();
        if (l.startsWith(q)) starts.push(c);
        else if (l.includes(q)) words.push(c);
    });

    const byLabel = (a, b) => a.label.localeCompare(b.label);

    return [
        ...starts.sort(byLabel),
        ...words.sort(byLabel),
    ];
}