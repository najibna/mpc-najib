package com.mpcnajib.intact.controller;

import com.mpcnajib.intact.dto.ReviewRequest;
import com.mpcnajib.intact.service.ReviewDecisionService;
import java.util.Map;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {
  private final ReviewDecisionService reviews;

  public ReviewController(ReviewDecisionService reviews) {
    this.reviews = reviews;
  }

  @PostMapping("/{id}/approve")
  public Map<String, Object> approve(@PathVariable String id, @RequestBody(required = false) ReviewRequest body) {
    var req = body == null ? new ReviewRequest(null, null) : body;
    return reviews.approve(id, req.decidedBy(), req.note());
  }

  @PostMapping("/{id}/deny")
  public Map<String, Object> deny(@PathVariable String id, @RequestBody(required = false) ReviewRequest body) {
    var req = body == null ? new ReviewRequest(null, null) : body;
    return reviews.deny(id, req.decidedBy(), req.note());
  }
}
