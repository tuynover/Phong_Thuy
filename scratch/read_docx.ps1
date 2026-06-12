Add-Type -AssemblyName System.IO.Compression.FileSystem

function Get-DocxText($path) {
    try {
        $zip = [System.IO.Compression.ZipFile]::OpenRead($path)
        $entry = $zip.Entries | Where-Object { $_.FullName -eq "word/document.xml" }
        if (-not $entry) {
            Write-Error "word/document.xml not found in zip archive"
            return
        }
        $stream = $entry.Open()
        $reader = New-Object System.IO.StreamReader($stream)
        $xmlText = $reader.ReadToEnd()
        $reader.Close()
        $stream.Close()
        $zip.Dispose()

        # Load as XML to parse cleanly
        $xml = [xml]$xmlText
        
        # Namespace manager for w:t
        $ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
        $ns.AddNamespace("w", "http://schemas.openxmlformats.org/wordprocessingml/2006/main")
        
        $textNodes = $xml.SelectNodes("//w:t", $ns)
        $output = @()
        foreach ($node in $textNodes) {
            $output += $node.InnerText
        }
        return ($output -join "")
    } catch {
        Write-Error $_.Exception.Message
    }
}

$docxPath = "T:\Phongthuy\data.docx"
$text = Get-DocxText $docxPath
$outputPath = "T:\Phongthuy\scratch\data_text.txt"
$text | Out-File -FilePath $outputPath -Encoding UTF8
Write-Output "Extracted docx text to $outputPath. Length: $($text.Length)"
