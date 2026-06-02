package com.mpcnajib.intact.controller;

import com.mpcnajib.intact.service.DatasetService;
import com.mpcnajib.intact.service.TransactionQueryService;
import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {
  private final TransactionQueryService queries;
  private final DatasetService datasets;

  public TransactionController(TransactionQueryService queries, DatasetService datasets) {
    this.queries = queries;
    this.datasets = datasets;
  }

  @GetMapping
  public Map<String, Object> list(@RequestParam(defaultValue = "100") int limit) {
    return Map.of("transactions", queries.listAll(limit), "count", queries.listAll(limit).size());
  }

  @GetMapping("/risky")
  public Map<String, Object> risky(@RequestParam(defaultValue = "50") int limit) {
    var items = queries.listRisky(limit);
    return Map.of("transactions", items, "count", items.size());
  }

  @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public Map<String, Object> upload(@RequestParam("file") MultipartFile file) throws IOException {
    if (file.isEmpty()) {
      return Map.of("ok", false, "error", "Empty file");
    }
    datasets.loadFromBytes(file.getBytes(), file.getOriginalFilename());
    var meta = new LinkedHashMap<String, Object>();
    meta.put("ok", true);
    meta.put("filename", file.getOriginalFilename());
    meta.put("rows_imported", datasets.require().transactions.size());
    meta.put("message", "Upload accepted; policy checks run asynchronously when RabbitMQ is enabled.");
    return meta;
  }
}
