"""Test script for Topic icon auto-selection."""

from app.models import auto_select_icon


def test_auto_select_icon():
    """Test auto_select_icon function with various inputs."""
    test_cases = [
        ("Office Work", "All work-related items", "BriefcaseIcon"),
        ("Personal Life", "My personal stuff", "UserIcon"),
        ("Shopping List", "Things to buy", "ShoppingCartIcon"),
        ("Creative Ideas", "Brainstorming session", "LightBulbIcon"),
        ("Learning Python", "Python course materials", "AcademicCapIcon"),
        ("Health & Fitness", "Workout routine", "HeartIcon"),
        ("Budget Planning", "Finance tracking", "CurrencyDollarIcon"),
        ("Home Improvements", "House renovation", "HomeIcon"),
        ("Travel Plans", "Trip to Europe", "GlobeAltIcon"),
        ("Code Review", "Programming tasks", "CodeBracketIcon"),
        ("Meeting Notes", "Calendar events", "CalendarIcon"),
        ("Reading List", "Books to read", "BookOpenIcon"),
        ("Music Playlist", "Audio files", "MusicalNoteIcon"),
        ("Random Stuff", "Miscellaneous items", "FolderIcon"),
        ("Alpha Initiative", "", "FolderIcon"),
        ("", "", "FolderIcon"),
        ("Daily Tasks", "Todo list", "CheckCircleIcon"),
        ("Life Goals", "Personal objectives", "FlagIcon"),
        ("Job Applications", "Career opportunities", "BriefcaseIcon"),
        ("Grocery Store", "Weekly shopping", "ShoppingCartIcon"),
        ("Workout Routine", "Fitness plan", "HeartIcon"),
    ]

    print("Testing auto_select_icon function:")
    print("=" * 80)

    all_passed = True
    for name, description, expected in test_cases:
        result = auto_select_icon(name, description)
        status = "PASS" if result == expected else "FAIL"
        if status == "FAIL":
            all_passed = False

        print(f"{status}: auto_select_icon('{name}', '{description}')")
        print(f"      Expected: {expected}, Got: {result}")
        print()

    print("=" * 80)
    if all_passed:
        print("All tests PASSED!")
    else:
        print("Some tests FAILED!")

    return all_passed


if __name__ == "__main__":
    test_auto_select_icon()
