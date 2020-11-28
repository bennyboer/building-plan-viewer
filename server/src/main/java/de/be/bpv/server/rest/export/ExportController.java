package de.be.bpv.server.rest.export;

import com.fasterxml.jackson.databind.ObjectMapper;
import de.be.bpv.server.persistence.cad.CADFile;
import de.be.bpv.server.persistence.cad.CADFileRepository;
import de.be.bpv.server.persistence.roommapping.RoomMappingCollection;
import de.be.bpv.server.persistence.roommapping.RoomMappingRepository;
import de.be.bpv.server.rest.export.request.ExportRequest;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.stream.Collectors;

/**
 * REST controller for exporting.
 */
@RestController
@RequestMapping("/api/export")
public class ExportController {

    /**
     * Repository managing CAD files.
     */
    private final CADFileRepository cadFileRepository;

    /**
     * Repository managing room mappings.
     */
    private final RoomMappingRepository roomMappingRepository;

    /**
     * Object mapper to use.
     */
    private final ObjectMapper objectMapper;

    /**
     * The base HTML for export resource.
     */
    @Value("classpath:static/export.html")
    Resource exportHTMLResource;

    public ExportController(
            CADFileRepository cadFileRepository,
            RoomMappingRepository roomMappingRepository,
            ObjectMapper objectMapper
    ) {
        this.cadFileRepository = cadFileRepository;
        this.roomMappingRepository = roomMappingRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Export the passed CAD file and mapping (optionally) as HTML.
     *
     * @param exportRequest to do export for
     * @return the exported HTML as string
     */
    @PostMapping("/html")
    public ResponseEntity<String> export(@RequestBody ExportRequest exportRequest) throws IOException {
        Document doc = getBaseExportHTMLDocument();

        CADFile cadFile = cadFileRepository.findById(exportRequest.getCadFileId()).orElse(null);
        if (cadFile == null) {
            return ResponseEntity.notFound().build();
        }

        RoomMappingCollection roomMappingCollection = exportRequest.getMappingId() != null
                ? roomMappingRepository.findById(exportRequest.getMappingId()).orElse(null)
                : null;

        // Build export settings
        ExportSettings exportSettings = new ExportSettings();
        exportSettings.setCadFile(cadFile);
        exportSettings.setRoomMappingCollection(roomMappingCollection);
        exportSettings.setColorMap(exportRequest.getColorMap());

        // Serialize export settings
        StringBuilder sb = new StringBuilder();
        sb.append("var app_isExportMode = true;");

        sb.append("var app_exportSettings = ");
        sb.append(objectMapper.writeValueAsString(exportSettings));
        sb.append(";");

        // Add export settings to export HTML
        Element headElement = doc.getElementsByTag("head").first();
        Element scriptElement = doc.createElement("script");
        scriptElement.appendText(sb.toString());
        headElement.insertChildren(0, scriptElement);

        return ResponseEntity.ok(doc.toString());
    }

    /**
     * Get the base export HTML document.
     *
     * @return base export HTML document
     * @throws IOException in case the HTML document could not be read
     */
    private Document getBaseExportHTMLDocument() throws IOException {
        // Read base HTML export file from resources
        String exportHTML = readExportHTML();

        // Parse export HTML in preparation of adding the CAD file and mapping
        return Jsoup.parse(exportHTML);
    }

    /**
     * Read the base export HTML from resources.
     *
     * @return base export HTML string
     * @throws IOException in case the HTML could not be read
     */
    private String readExportHTML() throws IOException {
        // Read base HTML export file from resources
        InputStream exportHTMLStream = exportHTMLResource.getInputStream();

        return new BufferedReader(new InputStreamReader(exportHTMLStream, StandardCharsets.UTF_8))
                .lines()
                .collect(Collectors.joining("\n"));
    }

}
