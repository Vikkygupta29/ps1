package in.gov.grantsetu.controller;

import in.gov.grantsetu.enums.UserRole;
import in.gov.grantsetu.model.User;
import in.gov.grantsetu.repository.UserRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserRepository userRepository;

    @Data
    public static class LoginRequest {
        private String emailOrUsername;
        private String password;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody LoginRequest request) {
        Optional<User> userOpt = userRepository.findByUsernameOrEmail(request.getEmailOrUsername(), request.getEmailOrUsername());

        if (userOpt.isEmpty()) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", "User not found with provided credentials.");
            return ResponseEntity.badRequest().body(err);
        }

        User user = userOpt.get();
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("token", "jwt-mock-token-" + user.getId() + "-" + user.getRole());
        res.put("user", user);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/switch-role")
    public ResponseEntity<Map<String, Object>> switchRole(@RequestBody Map<String, String> payload) {
        String roleStr = payload.get("role");
        UserRole role = UserRole.valueOf(roleStr);

        User demoUser = userRepository.findByRole(role).stream().findFirst().orElseGet(() ->
                userRepository.save(User.builder()
                        .username("demo_" + roleStr.toLowerCase())
                        .email(roleStr.toLowerCase() + "@gov.in")
                        .password("demo")
                        .fullName("Demo " + roleStr)
                        .role(role)
                        .region("Varanasi")
                        .build())
        );

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("token", "jwt-demo-token-" + demoUser.getId());
        res.put("user", demoUser);
        return ResponseEntity.ok(res);
    }
}
