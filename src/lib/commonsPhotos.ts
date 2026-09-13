export interface CommonsPhoto {
  id: string
  title: string
  imageUrl: string
  sourceUrl: string
  alt: string
  artist: string
  license: string
  capturedAt?: string
  year?: string
}

type CommonsMetadata = {
  value?: string
}

type CommonsImageInfo = {
  thumburl?: string
  descriptionurl?: string
  extmetadata?: Record<string, CommonsMetadata>
}

type CommonsPage = {
  pageid?: number
  title?: string
  imageinfo?: CommonsImageInfo[]
}

function plainText(value?: string) {
  return (value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
}

function metadataValue(metadata: Record<string, CommonsMetadata> | undefined, key: string) {
  return plainText(metadata?.[key]?.value)
}

function getYear(value?: string) {
  return value?.match(/(?:18|19|20)\d{2}/)?.[0]
}

function dateScore(value?: string) {
  const year = getYear(value)
  return year ? Number(year) : 0
}

function isUsefulPhoto(photo: CommonsPhoto, landmarkTitle: string) {
  const searchable = (photo.title + " " + photo.alt).toLowerCase()
  const title = landmarkTitle.toLowerCase()
  const unrelated = ["hue", "sacred gate", "xian", "nanjing"].some((word) => searchable.includes(word))
  return !unrelated && (searchable.includes(title) || searchable.includes("forbidden city") || searchable.includes("故宫"))
}

async function requestPhotos(query: string, signal?: AbortSignal) {
  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: `"${query}" "Forbidden City"`,
    gsrnamespace: "6",
    gsrlimit: "8",
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiurlwidth: "900",
    format: "json",
    origin: "*",
  })
  const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params.toString()}`, { signal })
  if (!response.ok) throw new Error("Wikimedia Commons request failed")
  const payload = await response.json() as { query?: { pages?: Record<string, CommonsPage> } }
  return Object.values(payload.query?.pages ?? {})
}

export async function fetchCommonsPhotos(title: string, chineseName: string, signal?: AbortSignal) {
  const pages = await requestPhotos(title, signal)
  const photos = pages.flatMap((page): CommonsPhoto[] => {
    const info = page.imageinfo?.[0]
    if (!info?.thumburl || !info.descriptionurl) return []
    const metadata = info.extmetadata
    const capturedAt = metadataValue(metadata, "DateTimeOriginal") || metadataValue(metadata, "DateTime")
    const alt = metadataValue(metadata, "ImageDescription") || page.title?.replace(/^File:/, "") || title
    return [{
      id: String(page.pageid ?? page.title),
      title: page.title?.replace(/^File:/, "") ?? title,
      imageUrl: info.thumburl,
      sourceUrl: info.descriptionurl,
      alt,
      artist: metadataValue(metadata, "Artist") || "Wikimedia Commons contributor",
      license: metadataValue(metadata, "LicenseShortName") || "See source",
      capturedAt,
      year: getYear(capturedAt),
    }]
  })

  const uniquePhotos = [...new Map(photos.map((photo) => [photo.imageUrl, photo])).values()]
    .filter((photo) => isUsefulPhoto(photo, title) || (chineseName && photo.alt.includes(chineseName)))
    .sort((left, right) => dateScore(right.capturedAt) - dateScore(left.capturedAt))

  return uniquePhotos.slice(0, 3)
}

export function commonsSearchUrl(title: string) {
  const query = encodeURIComponent(`${title} Forbidden City`)
  return `https://commons.wikimedia.org/w/index.php?search=${query}&title=Special:MediaSearch&type=image`
}
