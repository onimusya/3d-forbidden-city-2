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
  categories?: string
  angle?: CommonsPhotoAngle
}

export type CommonsPhotoAngle = "front" | "side" | "rear" | "elevated" | "courtyard" | "interior" | "detail" | "unknown"

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

function classifyAngle(photo: Pick<CommonsPhoto, "title" | "alt" | "categories">): CommonsPhotoAngle {
  const searchable = (photo.title + " " + photo.alt + " " + (photo.categories || "")).toLowerCase()
  if (/interior|inside|hall of union and peace/.test(searchable)) return "interior"
  if (/courtyard|inner court|within the court/.test(searchable)) return "courtyard"
  if (/top|roof|aerial|panorama|elevated/.test(searchable)) return "elevated"
  if (/side|east|west|southeast|southwest|northwest|northeast|view ne|view nw|view se|view sw/.test(searchable)) return "side"
  if (/from north|view n|north|rear|back/.test(searchable)) return "rear"
  if (/detail|decoration|dragon|tile|ornament/.test(searchable)) return "detail"
  if (/front|entrance|south facade|facade|view s|south/.test(searchable)) return "front"
  return "unknown"
}

const ANGLE_PRIORITY: readonly CommonsPhotoAngle[] = ["front", "side", "rear", "elevated", "courtyard", "interior", "detail", "unknown"]

function isUsefulPhoto(photo: CommonsPhoto, landmarkTitle: string) {
  const searchable = (photo.title + " " + photo.alt + " " + (photo.categories || "")).toLowerCase()
  const title = landmarkTitle.toLowerCase()
  const unrelated = ["hue", "sacred gate", "tian'anmen", "tiananmen", "xian", "nanjing", "stele"].some((word) => searchable.includes(word))
  return !unrelated && (searchable.includes(title) || searchable.includes("forbidden city") || searchable.includes("故宫"))
}

async function requestPhotos(query: string, signal?: AbortSignal) {
  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: `"${query}" "Forbidden City"`,
    gsrnamespace: "6",
    gsrlimit: "12",
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

async function requestCategoryPhotos(title: string, signal?: AbortSignal) {
  const categoryParams = new URLSearchParams({
    action: "query",
    list: "categorymembers",
    cmtitle: "Category:" + title + " (Forbidden City)",
    cmtype: "file",
    cmlimit: "40",
    format: "json",
    origin: "*",
  })
  const categoryResponse = await fetch("https://commons.wikimedia.org/w/api.php?" + categoryParams.toString(), { signal })
  if (!categoryResponse.ok) throw new Error("Wikimedia Commons category request failed")
  const categoryPayload = await categoryResponse.json() as { query?: { categorymembers?: Array<{ title?: string }> } }
  const titles = (categoryPayload.query?.categorymembers || []).map((member) => member.title).filter((member): member is string => Boolean(member))
  if (!titles.length) return []

  const imageParams = new URLSearchParams({
    action: "query",
    titles: titles.join("|"),
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiurlwidth: "900",
    format: "json",
    origin: "*",
  })
  const imageResponse = await fetch("https://commons.wikimedia.org/w/api.php?" + imageParams.toString(), { signal })
  if (!imageResponse.ok) throw new Error("Wikimedia Commons image request failed")
  const imagePayload = await imageResponse.json() as { query?: { pages?: Record<string, CommonsPage> } }
  return Object.values(imagePayload.query?.pages || {})
}

export async function fetchCommonsPhotos(title: string, chineseName: string, signal?: AbortSignal) {
  const queries: Array<[string, CommonsPhotoAngle]> = [
    [title, "front"],
    [title + " from north", "rear"],
    [title + " back", "rear"],
    [title + " side view", "side"],
    [title + " top", "elevated"],
  ]
  const requests: Array<Promise<Array<{ page: CommonsPage; fallbackAngle: CommonsPhotoAngle }>>> = [
    ...queries.map(([query, fallbackAngle]) => requestPhotos(query, signal).then((pages) => pages.map((page) => ({ page, fallbackAngle })))),
    requestCategoryPhotos(title, signal).then((pages) => pages.map((page) => ({ page, fallbackAngle: "unknown" as CommonsPhotoAngle }))),
  ]
  const responses = await Promise.allSettled(requests)
  if (signal?.aborted) throw new DOMException("The photo request was aborted", "AbortError")
  const pages = responses.flatMap((response) => response.status === "fulfilled" ? response.value : [])
  const photos = pages.flatMap(({ page, fallbackAngle }): CommonsPhoto[] => {
    const info = page.imageinfo?.[0]
    if (!info?.thumburl || !info.descriptionurl) return []
    const metadata = info.extmetadata
    const capturedAt = metadataValue(metadata, "DateTimeOriginal") || metadataValue(metadata, "DateTime")
    const alt = metadataValue(metadata, "ImageDescription") || page.title?.replace(/^File:/, "") || title
    const photo: CommonsPhoto = {
      id: String(page.pageid ?? page.title),
      title: page.title?.replace(/^File:/, "") ?? title,
      imageUrl: info.thumburl,
      sourceUrl: info.descriptionurl,
      alt,
      artist: metadataValue(metadata, "Artist") || "Wikimedia Commons contributor",
      license: metadataValue(metadata, "LicenseShortName") || "See source",
      capturedAt,
      year: getYear(capturedAt),
      categories: metadataValue(metadata, "Categories"),
    }
    photo.angle = classifyAngle(photo)
    if (photo.angle === "unknown") photo.angle = fallbackAngle
    return [photo]
  })

  const uniquePhotos = [...new Map(photos.map((photo) => [photo.imageUrl, photo])).values()]
    .filter((photo) => isUsefulPhoto(photo, title) || (chineseName && photo.alt.includes(chineseName)))
    .sort((left, right) => dateScore(right.capturedAt) - dateScore(left.capturedAt))

  const selected: CommonsPhoto[] = []
  for (const angle of ANGLE_PRIORITY) {
    const candidate = uniquePhotos.find((photo) => photo.angle === angle && !selected.includes(photo))
    if (candidate) selected.push(candidate)
  }
  for (const photo of uniquePhotos) {
    if (selected.length >= 4) break
    if (!selected.includes(photo)) selected.push(photo)
  }

  return selected.slice(0, 4)
}

export function commonsSearchUrl(title: string) {
  const query = encodeURIComponent(`${title} Forbidden City`)
  return `https://commons.wikimedia.org/w/index.php?search=${query}&title=Special:MediaSearch&type=image`
}
