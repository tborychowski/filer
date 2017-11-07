# Filer
A File Manager for the Keyboard People.



# TODO

- bookmarks bar - store history folders...
	- cmd+p should focus search but trigger the path-finder mode (filter bookmarks)
	- command-palette
- toolbar buttons for:
	- new folder
	- new file
	- open stuff here
- visual & progress for copy, paste & move
	- a tooltip over statusbar on copy?
	- flash the newly pasted item yellow (or sth.)
- addon: open terminal here
- addon: open finder here
- addon: open any app (sublime) here...
- addon: show notifications for some actions
    - e.g. delete (when undo is there, we could skip the confirmation)
- git: open repo here
- core: bulk rename, delete
- core: create nested folders (my/new/folder/path)
- core: cache folders, and bg sync
- core: settings (json?)
- undo/redo (operation history)

- if clicked on the highlighted after 1s item - trigger rename



## Dev install
```sh
git clone https://github.com/tborychowski/filer.git
cd filer
yarn
yarn start
```


## License
*MIT*
