package in.gov.grantsetu.repository;

import in.gov.grantsetu.model.Scheme;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SchemeRepository extends JpaRepository<Scheme, Long> {
    Optional<Scheme> findByCode(String code);
    List<Scheme> findByActiveTrue();
    List<Scheme> findByCategory(String category);
}
