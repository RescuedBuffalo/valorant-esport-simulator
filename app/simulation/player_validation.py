"""
Validation utilities for the player generation system.
"""
from typing import Dict, List, Optional, Union
from dataclasses import dataclass

@dataclass
class ValidationError:
    """Represents a validation error with a field and message."""
    field: str
    message: str

class PlayerValidation:
    """Validation utilities for player generation."""
    
    @staticmethod
    def validate_age(age: int) -> Optional[ValidationError]:
        """Validate player age."""
        if not isinstance(age, (int, float)):
            return ValidationError("age", "Age must be a number")
        if age < 16:
            return ValidationError("age", "Player must be at least 16 years old")
        if age > 35:
            return ValidationError("age", "Player must be under 35 years old")
        return None

    @staticmethod
    def validate_region(region: str, valid_regions: Dict[str, List[str]]) -> Optional[ValidationError]:
        """Validate player region."""
        if not isinstance(region, str):
            return ValidationError("region", "Region must be a string")
        if region not in valid_regions:
            return ValidationError("region", f"Invalid region. Must be one of: {', '.join(valid_regions.keys())}")
        return None

    @staticmethod
    def validate_role(role: str, valid_roles: Dict[str, List[str]]) -> Optional[ValidationError]:
        """Validate player role."""
        if not isinstance(role, str):
            return ValidationError("role", "Role must be a string")
        if role not in valid_roles:
            return ValidationError("role", f"Invalid role. Must be one of: {', '.join(valid_roles.keys())}")
        return None

    @staticmethod
    def validate_rating_range(min_rating: float, max_rating: float) -> Optional[ValidationError]:
        """Validate rating range."""
        if not isinstance(min_rating, (int, float)) or not isinstance(max_rating, (int, float)):
            return ValidationError("rating", "Ratings must be numbers")
        if min_rating < 0 or max_rating > 100:
            return ValidationError("rating", "Ratings must be between 0 and 100")
        if min_rating > max_rating:
            return ValidationError("rating", "Minimum rating cannot be greater than maximum rating")
        return None

    @staticmethod
    def validate_roster_size(size: int) -> Optional[ValidationError]:
        """Validate roster size."""
        if not isinstance(size, int):
            return ValidationError("rosterSize", "Roster size must be an integer")
        if size < 1:
            return ValidationError("rosterSize", "Roster size must be at least 1")
        if size > 10:
            return ValidationError("rosterSize", "Roster size cannot exceed 10")
        return None

    @staticmethod
    def validate_core_stats(stats: Dict[str, float]) -> List[ValidationError]:
        """Validate core stats."""
        errors = []
        required_stats = {'aim', 'gameSense', 'movement', 'utilityUsage', 'communication', 'clutch'}
        
        # Check for missing stats
        missing_stats = required_stats - set(stats.keys())
        if missing_stats:
            errors.append(ValidationError("coreStats", f"Missing required stats: {', '.join(missing_stats)}"))
        
        # Validate each stat
        for stat, value in stats.items():
            if not isinstance(value, (int, float)):
                errors.append(ValidationError(f"coreStats.{stat}", f"{stat} must be a number"))
            elif value < 0 or value > 100:
                errors.append(ValidationError(f"coreStats.{stat}", f"{stat} must be between 0 and 100"))
        
        return errors

    @staticmethod
    def validate_proficiencies(proficiencies: Dict[str, float], valid_items: List[str]) -> List[ValidationError]:
        """Validate proficiencies (roles or agents)."""
        errors = []
        
        # Check for missing items
        missing_items = set(valid_items) - set(proficiencies.keys())
        if missing_items:
            errors.append(ValidationError("proficiencies", f"Missing proficiencies for: {', '.join(missing_items)}"))
        
        # Validate each proficiency
        for item, value in proficiencies.items():
            if not isinstance(value, (int, float)):
                errors.append(ValidationError(f"proficiencies.{item}", f"{item} proficiency must be a number"))
            elif value < 0 or value > 100:
                errors.append(ValidationError(f"proficiencies.{item}", f"{item} proficiency must be between 0 and 100"))
            
        return errors

    @staticmethod
    def validate_career_stats(stats: Dict[str, Union[int, float]]) -> List[ValidationError]:
        """Validate career statistics."""
        errors = []
        required_stats = {
            'matchesPlayed': int,
            'kills': int,
            'deaths': int,
            'assists': int,
            'firstBloods': int,
            'clutches': int,
            'winRate': float,
            'kdRatio': float,
            'kdaRatio': float,
            'firstBloodRate': float,
            'clutchRate': float
        }
        
        # Check for missing stats
        missing_stats = set(required_stats.keys()) - set(stats.keys())
        if missing_stats:
            errors.append(ValidationError("careerStats", f"Missing required stats: {', '.join(missing_stats)}"))
        
        # Validate each stat
        for stat, value in stats.items():
            if stat in required_stats:
                expected_type = required_stats[stat]
                if not isinstance(value, (int, float)):
                    errors.append(ValidationError(f"careerStats.{stat}", f"{stat} must be a number"))
                elif expected_type == int and not float(value).is_integer():
                    errors.append(ValidationError(f"careerStats.{stat}", f"{stat} must be an integer"))
                elif value < 0:
                    errors.append(ValidationError(f"careerStats.{stat}", f"{stat} cannot be negative"))
                elif stat.endswith('Rate') and value > 1:
                    errors.append(ValidationError(f"careerStats.{stat}", f"{stat} must be between 0 and 1"))
        
        return errors 