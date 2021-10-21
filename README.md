# WB Coding Challenge

This is my solution to the coding challenge presented by Whitebox.

# Instructions

Both Docker and Node.js must be installed on your system.

Install the dependencies
```
npm install
```

Start up the docker container, and then the start script.
```
docker-compose up
npm run-script start
```

Note: If you have previous mysql images running, it may be necessary to run '''docker-compose down''' prior to these steps, as the script that loads the sql file will only be run on first initialization.

A build script is included to convert the given TS code to JS, though for the purposes of this challenge, we can run it directly with ts-node.

# Strategy

The given problem is, in essence, to group the dataset (for a particular client id) by shipping option, and then within each shipping option, by weight range. Grouping data in javascript is most easily done by using an object as a dictionary / lookup, or by using a map. While the former may be more familiar to long-term JS devs, I chose the latter due to it being more explicit and easy to read. I've also chosen to do the primary dataset transformation in a for ... of loop, though this could be done in a more functional way using Array.reduce. However, the for loop is more performant than reduce, and in my opinion, easier to read.

The only other particular item of note is that I have intentionally avoided having "else" clauses or nested if/else statements. This is a personal choice, but I believe it makes the code more easily readable and less prone to errors. There are obviously times where it can't be avoided, but this problem isn't one of those times.

Overall I think the problem is fairly straightforward, though there are a few situations that made me go "hmm" in whether they were intentional or not. Most of these are documented in comments in the code directly, while the rest are detailed in the next section.

# Caveats

There are a few aspects of this question that I was unsure of whether they were intentional or not. I'll detail them and explain how I handled them.

### Data Integrity

* The table specification for rates allows all values outside of the row id and customer id to be null. This means, in essence, we could have an entry with no zone specified, or no rate, etc. While not having a rate could theoretically make sense, I can't imagine how the rest would be represented in the output. I have modeled my interfaces directly after the DB, but am silently skipping rows where a null value exists (though, should a zone exist in a dataset but not for a particular weight tier, it will get marked as N/A).

* There is no constraint on the table that would prevent a duplicate combination of locale, shipping speed, weight tiers, and zone. So, in theory, there could be duplicated sets of data with different rates in the dataset. I have chosen to throw an error if this is detected, since this would indicate to me a serious flaw in the data.

### Matching Sample Output

* The tab naming convention on the sample output differs from the locale and speeds available from the dataset - namely that the speeds in the dataset for international locales includes "intl" (so a simple locale + speed would give you something like 'International IntlEconomy'). This is easy enough replace and match up with the sample, but it was unclear to me if that was actually intended or not.

* The tabs in the sample output are also not in any sort of alphabetical ordering, nor are there any explicit tiers tied to the speeds. The only viable way to match the tab ordering is to hardcode tiers for these values, which I don't like to do, but I don't know if matching the tab ordering was expected.

* Similarly, I don't know if the column spacing was intended to be matched either. 

# Libraries

Three libraries are used for this solution.

Mysql2 - Used to connect to and query the MySQL database in the docker container.

xlsx - Used to build the spreadsheet output

dotenv - Used to load environment variables