export const fmtHeader = (n: number) => `€${n.toFixed(2)}`
export const fmtTable = (n: number) => n.toFixed(2).replace('.', ',')
export const fmtHours = (n: number) => `${n.toFixed(2)} hrs`
export const fmtItemsTotal = (n: number) => n.toFixed(2).replace('.', ',')
