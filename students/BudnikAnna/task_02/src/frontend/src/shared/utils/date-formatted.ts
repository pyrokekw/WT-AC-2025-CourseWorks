export const dateFormated = (date: string) => {
    const v = date
    const d = new Date(v || '')

    if (Number.isNaN(d.getTime())) return ''

    return new Intl.DateTimeFormat('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(d)
}
