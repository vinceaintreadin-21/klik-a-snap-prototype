from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('api', '0002_institution_deactivation'),
    ]

    operations = [
        migrations.AddField(
            model_name='idlayout',
            name='show_photo',
            field=models.BooleanField(default=True),
        ),
    ]
