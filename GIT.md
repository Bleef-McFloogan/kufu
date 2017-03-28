# Git

Here's a quick reference on how to use git:

## Initial Setup

You only need to do these steps once to set up your local dev environment.

These steps assume you have linux running in a vm. I used Ubuntu 16.04.1 Long Term Support (LTS) from https://www.ubuntu.com/download/desktop.

If git isn't installed on your linux machine, you need to install it. If you're using Ubuntu or a derivative of it, you can do <pre>sudo apt-get install git</pre> on the command line to install git.

```
$ cd ~
$ mkdir 320
$ cd 320
$ git init
$ git remote add origin http://prajna.caslab.queensu.ca/git/datatron.git
$ git pull origin master
```

Now if you run `$ ls` you should see the files that were pulled from the repo, like README.md.

## Working on a feature

### Creating a new branch

When you start working on a new feature, you need to make a new branch. For illustration purposes I'll use issue 1057: "Install Proxygen on Server."

```
$ cd ~/320
$ git checkout master     # Switch to master branch
$ git pull origin master  # Pull changes from repo
$ git checkout -b 1057    # Create a new branch named after the issue number and switch to it
```

Set the issue status to "In Progress" in Redmine. You're now able to start coding your feature.

### Implementing the feature

Write the code.

You can use the following commands to check on your progress while you code:

```
$ git status  # See which files have been modified, created, deleted, etc.
$ git diff    # See line-by-line for each file which lines have been modified, created, deleted, etc.
$ git log     # See commit history
$ git branch  # See what branch you're on and what other ones exist
```

You'll probably use `git status` and `git diff` a lot.

### Committing changes

Now I'm done writing a section of the code and I want to "save" those changes as a commit.

```
$ git status                                  # Make sure I know what changes I'm about to commit
$ git add -A                                  # Add the modified files to the commit. You can individually add each file instead if you don't want to commit all changes.
$ git commit -m "Message describing changes"  # Make the commit and give it a message
$ git status                                  # Should show that the files you committed aren't listed as modified anymore, because they've been committed.
```

Committing "saves" your changes locally, but they haven't been pushed to the repo yet.

### Pushing to the repo

Once you've done as many commits as you need to fully implement the feature, you can push the commits to the repo.

```
$ git push origin 1057  # Push branch to repo
```

Now that the changes are pushed to the repo, they need to be pulled down by someone else to be tested and reviewed. Mark the issue you worked on in the issue tracker to 100% complete and set the status of the issue to "Resolved".

## Peer Reviewing Someone Else's Feature

When someone finishes a feature, we need someone else to check their code to make sure it works and is up to snuff. Peer review is like getting someone to proofread/edit your essay for you.

Find an issue to peer review by checking the Slack channel and the issue tracker for issues set to "Resolved." Set the issue status to "Feedback" in Redmine when you start your peer review.

```
$ cd ~/320
$ git checkout master
$ git pull origin master
$ git fetch --all
$ git checkout 1057

Compile and test the code.

Review the code and provide feedback.
```

### Merging peer reviewed code into master branch

If the code is all good and everything works, then that branch can be merged into master.

```
$ git checkout master
$ git merge 1057       # Merge 1057 into my current branch, which is master
```

### Resolving Merge Conflicts

If there are any merge conflicts when merging the branch into master, then deal with them manually by editing the files with the conflicts in them. *IF* you made changes to fix conflicts, run

```
$ git add -A
$ git commit -m "Fixed merge conflicts merging 1057 into master"
```

Otherwise you can skip straight to this step (you do this if you fixed changes too):

```
$ git push origin master
```

Set the issue status to "Closed" in Redmine.

Now the branch was merged into master and pushed to the repo. Feature complete. It can now be marked as complete in the issue tracker.