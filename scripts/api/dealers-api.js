const cache = new Map();

function toSlug(city) {
    return city.trim().toLowerCase().replace(/\s+/g, '-');
}

export function fetchDealers(baseUrl, city) {
    if (!baseUrl || !city) return Promise.resolve(null);

    const url = `${baseUrl}${toSlug(city)}.json`;

    if (!cache.has(url)) {
        const request = fetch(url)
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }

                return res.json();
            })
            .catch((e) => {
                cache.delete(url);
                throw e;
            });
        cache.set(url, request);
    }

    return cache.get(url);
};

export function filterServiceStations(list) {
    const SERVICE_TYPE = 'servicebranch';
    if (!Array.isArray(list)) return [];
    return list.filter((d) => String(d.type || '')
        .toLowerCase() === SERVICE_TYPE);
}

export async function fetchServiceStations(base, city) {
    const listOfDealers = await fetchDealers(base, city);
    return filterServiceStations(listOfDealers);
}