import csv
import pandas as pd

f=pd.read_csv("")
keep_col = ['Date','Latitude','Longitude','Depth', "Magnitude"]
new_f = f[keep_col]
new_f.to_csv("", index=False)