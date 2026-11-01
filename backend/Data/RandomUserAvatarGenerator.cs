using Bogus;
using Bogus.DataSets;

namespace Backend.Data;

public static class RandomUserAvatarGenerator
{
    private const string PortraitsUrl = "https://randomuser.me/api/portraits";

    public static string Generate(Faker faker, Name.Gender? gender = null)
    {
        var selectedGender = gender ?? faker.Random.ArrayElement(
            [Name.Gender.Male, Name.Gender.Female]
        );
        var category = selectedGender == Name.Gender.Male ? "men" : "women";
        var imageNumber = faker.Random.Int(0, 99);

        return $"{PortraitsUrl}/{category}/{imageNumber}.jpg";
    }
}
