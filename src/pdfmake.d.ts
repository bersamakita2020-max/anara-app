declare module 'pdfmake/build/pdfmake' {
  interface PdfFile {
    download: (name?: string) => void
    getBlob: (callback: (blob: Blob) => void) => void
  }
  interface PdfMaker {
    addVirtualFileSystem: (vfs: Record<string, string>) => void
    addFonts: (fonts: Record<string, { normal: string; bold: string; italics: string; bolditalics: string }>) => void
    createPdf: (doc: unknown) => PdfFile
  }
  const pdfMake: PdfMaker
  export default pdfMake
}

declare module 'pdfmake/build/vfs_fonts' {
  const vfs: Record<string, string>
  export default vfs
}
