# Changelog

All notable changes are written here. The version follows [Semantic Versioning](https://semver.org): `MAJOR.MINOR.PATCH`.

- **PATCH** (0.9.1): a fix, with no new feature.
- **MINOR** (0.10.0): a new feature that does not break anything.
- **MAJOR** (1.0.0): a big change, or the first stable release.

The number lives in `package.json`. The app shows it in the footer, and `/api/health` reports it.

## 0.9.0 (public beta)

The first version shared with real teams. It is feature complete for a class project group, and it may still change before 1.0.0.

### Added

- **Daily ToDo** with main points, tasks to tick, progress in percent and a live preview.
- **Tasks**: one person, some people, or everyone. Team tasks, import from Google Sheets or Excel, edit, approve, approve all, request changes and reopen.
- **Filters** that work the same on Overview, Daily ToDo and Tasks: whose, when (today, overdue, a range of dates) and status.
- **Streaks and pokes**: days in a row with a daily ToDo, a ranking for the team, and one poke per person per day.
- **Telegram messages** (optional): pokes and the same notifications as the bell, in the language of the person.
- **Notifications**: a read notification leaves the list, and the bell rings when a new one comes.
- **Comments and reactions**: chat bubbles, seven reactions, and emoji that fly up when you react.
- **Celebrations**: confetti for a streak milestone and for an approval, a flickering flame for a streak (switched off for people who asked for less motion).
- **Usernames**: log in with a short username instead of the email.
- **Avatars**: 30 sticker avatars, including Khmer people from the Funan kingdom to today.
- **Search pages**: `/guide` and `/en/guide` with sitemap and structured data.
- Khmer and English, light and dark mode, mobile layout, printable report, timeline.

### Changed

- All texts were read again in Khmer and English: the same word for the same thing, and punctuation in the right place.
- Approved work is locked for everyone until a leader reopens it.

### Database

- Migrations 001 to 022. They run by themselves when the server starts.
