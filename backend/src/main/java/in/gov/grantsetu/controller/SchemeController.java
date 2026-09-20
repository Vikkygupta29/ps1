package in.gov.grantsetu.controller;

import in.gov.grantsetu.model.Scheme;
import in.gov.grantsetu.repository.SchemeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/schemes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SchemeController {

    private final SchemeRepository schemeRepository;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllActiveSchemes() {
        List<Scheme> schemes = schemeRepository.findByActiveTrue();
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("schemes", schemes);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getSchemeById(@PathVariable Long id) {
        return schemeRepository.findById(id)
                .map(scheme -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", true);
                    response.put("scheme", scheme);
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createScheme(@RequestBody Scheme scheme) {
        Scheme saved = schemeRepository.save(scheme);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("scheme", saved);
        return ResponseEntity.ok(response);
    }
}
